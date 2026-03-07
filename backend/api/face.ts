import { Router, Request, Response } from "express";

import { AzureKeyCredential } from "@azure/core-auth";
import createClient, { FaceClient } from "@azure-rest/ai-vision-face";

const endpoint = process.env.FACE_ENDPOINT;
const apiKey = process.env.FACE_API_KEY;

if (!endpoint || !apiKey) {
    throw new Error("Please provide a face endpoint and api key in the .env file");
}

const createFaceClient = (): FaceClient => {
    const credential = new AzureKeyCredential(apiKey);
    const client = createClient(endpoint, credential);
    return client;
}

const router: Router = Router(); 

router.get("/health", (req: Request, res: Response) => {
    
    try {
        const client = createFaceClient();
        res.send("Face API is healthy");

    } catch (error) {
        res.status(500).send("Face API is not healthy");
    }
})


export default router;