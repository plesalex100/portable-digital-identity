import mongoose from "mongoose";

const personSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, auto: true },
    name: { type: String },
    faceId: String
})


export default mongoose.model("Person", personSchema, "person");