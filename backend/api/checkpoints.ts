import { Router } from "express";
import Checkpoint from "../models/Checkpoint.js";
import ensureDatabaseConnected from "../db/init.js";

const router = Router();

router.get("/", async (req, res) => {
    try {
        await ensureDatabaseConnected();
        const checkpoints = await Checkpoint.find();
        res.json({ success: true, data: checkpoints });
    } catch (error) {
        console.error("Error fetching checkpoints:", error);
        res.status(500).json({ success: false, message: "Failed to fetch checkpoints" });
    }
});

export default router;
