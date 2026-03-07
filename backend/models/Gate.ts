import mongoose from "mongoose";

const gateSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, auto: true },
    label: String
})

export default mongoose.model("Gate", gateSchema, "gate");