import { Router } from "express";
import multer from "multer";
import { getFaceConfig } from "../config/face.js";
import {
    ensurePersonGroup,
    createPerson,
    addFaceToPerson,
    trainPersonGroup,
    detectSingleFace,
    identifyFace,
    FaceServiceError,
} from "../services/faceService.js";
import ensureDatabaseConnected from "../db/init.js";
import Person from "../models/Person.js";

const router = Router();

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/bmp", "image/gif"];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // Azure Face API limit: 10 MB per image
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
        const { name } = req.body as { name?: string };

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

        // ── Azure: ensure group exists ──
        await ensurePersonGroup();

        // ── Azure: create person ──
        const azurePersonId = await createPerson(name.trim());
        console.log(`Created Azure Person: ${azurePersonId} for name: ${name.trim()}`);

        // ── Azure: add each face ──
        const persistedFaceIds: string[] = [];
        for (const file of files) {
            const persistedFaceId = await addFaceToPerson(azurePersonId, file.buffer);
            persistedFaceIds.push(persistedFaceId);
            console.log(`Added face ${persistedFaceId} to person ${azurePersonId}`);
        }

        // ── Azure: train the group ──
        await trainPersonGroup();

        // ── Database: persist user ──
        await ensureDatabaseConnected();
        const person = await Person.create({
            name: name.trim(),
            azurePersonId,
            enrolledAt: new Date(),
        });

        res.status(201).json({
            success: true,
            message: "Person enrolled successfully",
            data: {
                personId: person._id,
                name: person.name,
                azurePersonId: person.azurePersonId,
                enrolledAt: person.enrolledAt,
                facesAdded: persistedFaceIds.length,
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

router.post("/verify", upload.single("image"), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            res.status(400).json({ success: false, message: "An image file is required (field 'image')" });
            return;
        }

        // ── Azure: detect face ──
        const faceId = await detectSingleFace(file.buffer);

        // ── Azure: identify against group ──
        const candidate = await identifyFace(faceId);

        if (!candidate) {
            res.status(404).json({
                success: false,
                code: "UNKNOWN_FACE",
                message: "No matching person found",
            });
            return;
        }

        // ── Database: look up local user ──
        await ensureDatabaseConnected();
        const person = await Person.findOne({ azurePersonId: candidate.personId });

        if (!person) {
            res.status(404).json({
                success: false,
                code: "USER_NOT_FOUND",
                message: "Matched an Azure person but no corresponding local record found",
            });
            return;
        }

        res.json({
            success: true,
            message: "Person verified successfully",
            data: {
                personId: person._id,
                name: person.name,
                azurePersonId: person.azurePersonId,
                enrolledAt: person.enrolledAt,
                confidence: candidate.confidence,
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