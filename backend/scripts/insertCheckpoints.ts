import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Checkpoint from "../models/Checkpoint.js";
import { ensureDatabaseConnected } from "../db/init.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const CHECKPOINTS = [
    { id: "security-gate", label: "Security Gate", requiredStatuses: ["checked-in"], nextStatus: "passed-security-gate" },
    { id: "immigration", label: "Immigration Control", requiredStatuses: ["passed-security-gate"], nextStatus: "passed-immigration" },
    { id: "duty-free", label: "Duty-Free Shops", requiredStatuses: ["passed-immigration", "at-lounge"], nextStatus: "at-duty-free" },
    { id: "lounge", label: "Lounge Access", requiredStatuses: ["passed-immigration", "at-duty-free"], nextStatus: "at-lounge" },
    { id: "gate", label: "Boarding Gate", requiredStatuses: ["passed-immigration", "at-duty-free", "at-lounge"], nextStatus: "passed-gate" }
];

async function run() {
    try {
        await ensureDatabaseConnected();

        for (const cp of CHECKPOINTS) {
            await Checkpoint.findOneAndUpdate(
                { id: cp.id },
                cp,
                { upsert: true, new: true }
            );
        }

        console.log("Checkpoints inserted successfully");
        process.exit(0);
    } catch (err) {
        console.error("Error inserting checkpoints:", err);
        process.exit(1);
    }
}

run();
