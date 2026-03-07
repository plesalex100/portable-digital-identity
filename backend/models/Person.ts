import mongoose from "mongoose";

enum PersonStatus {
    CHECKED_IN = "checked-in",
    SECURITY_SCREENING = "security-screening",
    SECURITY_CLEARED = "security-cleared",
    AT_GATE = "at-gate",
    BOARDING = "boarding",
    BOARDED = "boarded",
    FLAGGED = "flagged",
}

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
        enum: Object.values(PersonStatus),
        default: "checked-in",
    },
    verificationScore: { type: Number, default: null },
    metadata: {
        type: {
            isFakeUser: { type: Boolean, default: false },
        },
        default: {},
    },
});

export default mongoose.model("Person", personSchema, "person");
export { PersonStatus };