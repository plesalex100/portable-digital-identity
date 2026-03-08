import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import API from "./api/index";

if (!process.env.PORT) {
    throw new Error("Please provide a port in the .env file");
}

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Frontend here");
});

app.get("/api/presentation", (req, res) => {
    res.sendFile(path.join(__dirname, "presentation.pdf"));
});

app.use("/api", API);

app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
});
