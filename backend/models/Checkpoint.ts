import mongoose from "mongoose";

const checkpointSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, auto: true },
    id: String,
    label: String,
    requiredStatuses: [String],
    nextStatus: String,
})

export default mongoose.model("Checkpoint", checkpointSchema, "checkpoint");