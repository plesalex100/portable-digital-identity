import mongoose from "mongoose";

const personSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, auto: true },
    name: { type: String, required: true },
    enrolledAt: { type: Date, default: null },
});

export default mongoose.model("Person", personSchema, "person");