import { Router } from "express";
import ensureDatabaseConnected from "../db/init.js";
import Person from "../models/Person.js";

const router = Router();

// GET /api/passengers
router.get("/", async (_req, res) => {
    try {
        await ensureDatabaseConnected();
        const passengers = await Person.find().sort({ boardingTime: 1 });
        res.json({ success: true, data: passengers });
    } catch (error) {
        console.error("Passengers fetch error:", (error as Error).message);
        res.status(500).json({ success: false, message: "Failed to fetch passengers" });
    }
});

// GET /api/passengers/check/:passportNumber
router.get("/check/:passportNumber", async (req, res) => {
    try {
        await ensureDatabaseConnected();
        const person = await Person.findOne({ passportNumber: req.params.passportNumber });
        if (person) {
            res.json({ success: true, exists: true, data: { personId: person._id, name: person.name, status: person.status } });
        } else {
            res.json({ success: true, exists: false });
        }
    } catch (error) {
        console.error("Passenger check error:", (error as Error).message);
        res.status(500).json({ success: false, message: "Failed to check passenger" });
    }
});

export default router;
