import { Router } from "express";
import multer from "multer";
import { getFaceConfig } from "../config/face.js";
import {
    enrollFace,
    compareFaceAgainstEnrolled,
    detectSingleFace,
    FaceServiceError,
} from "../services/faceService.js";
import ensureDatabaseConnected from "../db/init.js";
import Person, { PersonStatus } from "../models/Person.js";
import Checkpoint from "../models/Checkpoint.js";

const router = Router();

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/bmp", "image/gif"];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid image type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`));
        }
    },
});

// ──────────────────────────────────────────────
// GET /api/face/health
// ──────────────────────────────────────────────

router.get("/health", (_req, res) => {
    res.json({ success: true, message: "Face API is healthy" });
});

// ──────────────────────────────────────────────
// POST /api/face/enroll
// ──────────────────────────────────────────────
// multipart/form-data:
//   - name: string (required)
//   - images: File[] (1..maxImages)
// ──────────────────────────────────────────────

router.post("/enroll", upload.array("images"), async (req, res) => {
    try {
        const { name, passportNumber, nationality, flightNumber, airline, departure, arrival, gate } = req.body as Record<string, string | undefined>;

        // ── Input validation ──
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            res.status(400).json({ success: false, message: "Field 'name' is required and must be a non-empty string" });
            return;
        }

        const files = req.files as Express.Multer.File[] | undefined;

        if (!files || files.length === 0) {
            res.status(400).json({ success: false, message: "At least one image file is required (field 'images')" });
            return;
        }

        if (files.length > getFaceConfig().maxImages) {
            res.status(400).json({
                success: false,
                message: `Too many images. Maximum allowed: ${getFaceConfig().maxImages}`,
            });
            return;
        }

        // ── Database: check for duplicate check-in ──
        await ensureDatabaseConnected();

        if (passportNumber) {
            const existing = await Person.findOne({ passportNumber: passportNumber.trim() });
            if (existing) {
                res.status(409).json({
                    success: false,
                    code: "ALREADY_CHECKED_IN",
                    message: `Passenger with passport ${passportNumber} is already checked in`,
                    data: {
                        personId: existing._id,
                        name: existing.name,
                        status: existing.status,
                    },
                });
                return;
            }
        }

        const person = await Person.create({
            name: name.trim(),
            enrolledAt: new Date(),
            passportNumber: passportNumber?.trim() || null,
            nationality: nationality?.trim() || null,
            flightNumber: flightNumber?.trim() || null,
            airline: airline?.trim() || null,
            departure: departure?.trim() || null,
            arrival: arrival?.trim() || null,
            gate: gate?.trim() || null,
        });

        const personId = person._id!.toString();
        console.log(`Created person: ${personId} for name: ${name.trim()}`);

        // ── AWS: validate faces & upload to S3 ──
        const imageBuffers = files.map((f) => f.buffer);
        const uploadedKeys = await enrollFace(personId, imageBuffers);
        console.log(`Enrolled ${uploadedKeys.length} face(s) for person ${personId}`);

        res.status(201).json({
            success: true,
            message: "Person enrolled successfully",
            data: {
                personId: person._id,
                name: person.name,
                enrolledAt: person.enrolledAt,
                facesAdded: uploadedKeys.length,
            },
        });
    } catch (error) {
        if (error instanceof FaceServiceError) {
            res.status(422).json({ success: false, code: error.code, message: error.message });
            return;
        }

        console.error("Enroll error:", (error as Error).message);
        res.status(500).json({ success: false, message: "Enrollment failed" });
    }
});

// ──────────────────────────────────────────────
// POST /api/face/verify
// ──────────────────────────────────────────────
// multipart/form-data:
//   - image: File (single, required)
// ──────────────────────────────────────────────

// Checkpoint flow config has been moved to MongoDB


const STATUS_LABELS: Record<string, string> = {
    "checked-in":            "Checked In",
    "passed-security-gate":  "Security Gate",
    "passed-immigration":    "Immigration Control",
    "at-duty-free":          "Duty-Free Shops",
    "at-lounge":             "Lounge Access",
    "passed-gate":           "Boarding Gate",
};

router.post("/verify", upload.single("image"), async (req, res) => {
    try {
        const verifyStart = performance.now();
        const file = req.file;
        const checkpoint = (req.body as { checkpoint?: string }).checkpoint || "security-gate";

        if (!file) {
            res.status(400).json({ success: false, message: "An image file is required (field 'image')" });
            return;
        }

        await ensureDatabaseConnected();
        const flow = await Checkpoint.findOne({ id: checkpoint });
        if (!flow) {
            res.status(400).json({ success: false, message: `Unknown checkpoint: ${checkpoint}` });
            return;
        }

        console.log(`[verify-timing] ── START verify (checkpoint=${checkpoint}, imageSize=${(file.buffer.length / 1024).toFixed(0)}KB) ──`);

        // ── AWS Rekognition: detect that exactly one face exists ──
        await detectSingleFace(file.buffer);

        // ── AWS Rekognition: compare against all enrolled faces ──
        const match = await compareFaceAgainstEnrolled(file.buffer);

        if (!match) {
            res.status(404).json({
                success: false,
                code: "UNKNOWN_FACE",
                message: "No matching person found",
            });
            return;
        }

        // ── Database: look up local user ──
        const person = await Person.findById(match.personId);

        if (!person) {
            res.status(404).json({
                success: false,
                code: "USER_NOT_FOUND",
                message: "Matched faces but no corresponding local record found",
            });
            return;
        }

        // ── Enforce checkpoint order ──
        const currentStatus = person.status || "checked-in";
        if (!flow.requiredStatuses.includes(currentStatus)) {
            res.status(403).json({
                success: false,
                code: "WRONG_CHECKPOINT_ORDER",
                message: `Cannot use ${flow.label} — passenger status is "${STATUS_LABELS[currentStatus] || currentStatus}"`,
                data: {
                    personId: person._id,
                    name: person.name,
                    currentStatus,
                    currentStatusLabel: STATUS_LABELS[currentStatus] || currentStatus,
                    requiredStatuses: flow.requiredStatuses,
                    checkpoint,
                    confidence: match.confidence,
                },
            });
            return;
        }

        // ── Update status if checkpoint advances it ──
        if (flow.nextStatus) {
            person.status = flow.nextStatus as unknown as PersonStatus;
            person.verificationScore = match.confidence;
            await person.save();
        }

        console.log(`[verify-timing] ── END verify: ${(performance.now() - verifyStart).toFixed(0)}ms total ──`);

        res.json({
            success: true,
            message: "Person verified successfully",
            data: {
                personId: person._id,
                name: person.name,
                enrolledAt: person.enrolledAt,
                confidence: match.confidence,
                status: person.status,
                statusLabel: STATUS_LABELS[person.status || ""] || person.status,
                checkpoint,
                checkpointLabel: flow.label,
                flightNumber: person.flightNumber || null,
                gate: person.gate || null,
            },
        });
    } catch (error) {
        if (error instanceof FaceServiceError) {
            res.status(422).json({ success: false, code: error.code, message: error.message });
            return;
        }

        console.error("Verify error:", (error as Error).message);
        res.status(500).json({ success: false, message: "Verification failed" });
    }
});

export default router;