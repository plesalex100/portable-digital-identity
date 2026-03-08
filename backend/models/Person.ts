import mongoose from "mongoose";

enum PersonStatus {
    CHECKED_IN = "checked-in",
    PASSED_SECURITY_GATE = "passed-security-gate",
    PASSED_IMMIGRATION = "passed-immigration",
    AT_DUTY_FREE = "at-duty-free",
    AT_LOUNGE = "at-lounge",
    PASSED_GATE = "passed-gate",
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