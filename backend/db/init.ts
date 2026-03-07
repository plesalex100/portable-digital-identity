import mongoose from "mongoose";
const { MONGO_URL, DATABASE_NAME } = process.env;

if (!MONGO_URL || !DATABASE_NAME) {
    throw new Error("Please provide a mongo url and database name in the .env file");
}

export const ensureDatabaseConnected = async () => {
    if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) {
        return;
    }

    try {
        await mongoose.connect(MONGO_URL, {
            dbName: DATABASE_NAME,
            autoIndex: true
        });
        console.log(`MongoDB Connected. Database ${DATABASE_NAME}`);
    } catch (error) {
        console.error(error);
    }
}

export default ensureDatabaseConnected;