import mongoose from "mongoose";

const personSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, auto: true },
    name: { type: String, required: true },
    enrolledAt: { type: Date, default: null },
    nationality: { type: String, default: null },
    passportNumber: { type: String, default: null },
    flightNumber: { type: String, default: null },
    airline: { type: String, default: null },
    departure: { type: String, default: null },
    arrival: { type: String, default: null },
    gate: { type: String, default: null },
    seat: { type: String, default: null },
    boardingTime: { type: Date, default: null },
    status: {
        type: String,
        enum: [
            "checked-in",
            "security-screening",
            "security-cleared",
            "at-gate",
            "boarding",
            "boarded",
            "flagged",
        ],
        default: "checked-in",
    },
    verificationScore: { type: Number, default: null },
});

export default mongoose.model("Person", personSchema, "person");