import { Router, Request, Response } from "express";

import { AzureKeyCredential } from "@azure/core-auth";
import createClient, { FaceClient } from "@azure-rest/ai-vision-face";

const createFaceClient = (): FaceClient => {
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

router.get("/health", (req: Request, res: Response) => {
    try {
        const _client = createFaceClient();
        res.json({success: true, message: "Api is healthy"});
    } catch (error) {
        res.status(500).json({success: false, message: "Face API is not healthy"});
    }
});

router.post("/enroll", function(req: Request, res: Response){
    
    const { name, image } = req.body;

})




export default router;