import { Router } from "express";

import { AzureKeyCredential } from "@azure/core-auth";
import createClient from "@azure-rest/ai-vision-face";

const createFaceClient = () => {
    const endpoint = process.env.FACE_ENDPOINT;
    const apiKey = process.env.FACE_API_KEY;

    if (!endpoint || !apiKey) {
        throw new Error("Please provide a face endpoint and api key in the .env file");
    }

    const credential = new AzureKeyCredential(apiKey);
    const client = createClient(endpoint, credential);
    return client;
}

const router = Router();

router.get("/health", (req, res) => {
    try {
        const _client = createFaceClient();
        res.json({success: true, message: "Api is healthy"});
    } catch (error) {
        res.status(500).json({success: false, message: "Face API is not healthy"});
    }
});

type EnrollRequest = {
    name: string;
    image: string;
}

router.post("/enroll", async function(req, res){
    
    const { name, image } = req.body as EnrollRequest;
    if (!name || !image) {
        return res.status(400).json({success: false, message: "Name and image are required"});
    }

})




export default router;