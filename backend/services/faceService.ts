import { AzureKeyCredential } from "@azure/core-auth";
import createClient, { isUnexpected, getLongRunningPoller } from "@azure-rest/ai-vision-face";
import { getFaceConfig } from "../config/face.js";

const DETECTION_MODEL = "detection_03" as const;

let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
    if (!_client) {
        const config = getFaceConfig();
        _client = createClient(config.endpoint, new AzureKeyCredential(config.apiKey));
    }
    return _client;
}

/**
 * Ensure the LargePersonGroup exists. Creates it if missing.
 */
export async function ensurePersonGroup(): Promise<void> {
    const faceConfig = getFaceConfig();
    const client = getClient();
    const getRes = await client
        .path("/largepersongroups/{largePersonGroupId}", faceConfig.personGroupId)
        .get();

    if (getRes.status === "200") {
        return;
    }

    const createRes = await client
        .path("/largepersongroups/{largePersonGroupId}", faceConfig.personGroupId)
        .put({
            body: {
                name: faceConfig.personGroupId,
                recognitionModel: faceConfig.recognitionModel,
            },
        });

    if (isUnexpected(createRes)) {
        throw new Error(`Failed to create person group: ${createRes.body.error.message}`);
    }

    console.log(`Created LargePersonGroup: ${faceConfig.personGroupId}`);
}

/**
 * Create a Person inside the LargePersonGroup.
 * Returns the Azure personId string.
 */
export async function createPerson(name: string): Promise<string> {
    const faceConfig = getFaceConfig();
    const res = await getClient()
        .path("/largepersongroups/{largePersonGroupId}/persons", faceConfig.personGroupId)
        .post({
            body: { name },
        });

    if (isUnexpected(res)) {
        throw new Error(`Failed to create person: ${res.body.error.message}`);
    }

    return res.body.personId;
}

/**
 * Add a face image (binary buffer) to an existing Person.
 * Returns the persistedFaceId.
 */
export async function addFaceToPerson(personId: string, imageBuffer: Buffer): Promise<string> {
    const faceConfig = getFaceConfig();
    const res = await getClient()
        .path(
            "/largepersongroups/{largePersonGroupId}/persons/{personId}/persistedfaces",
            faceConfig.personGroupId,
            personId,
        )
        .post({
            queryParameters: {
                detectionModel: DETECTION_MODEL,
            },
            contentType: "application/octet-stream",
            body: imageBuffer as unknown as Uint8Array,
        });

    if (isUnexpected(res)) {
        throw new Error(`Failed to add face: ${res.body.error.message}`);
    }

    return res.body.persistedFaceId;
}

/**
 * Train the LargePersonGroup and wait for completion.
 */
export async function trainPersonGroup(): Promise<void> {
    const faceConfig = getFaceConfig();
    const trainRes = await getClient()
        .path("/largepersongroups/{largePersonGroupId}/train", faceConfig.personGroupId)
        .post();

    const poller = await getLongRunningPoller(getClient(), trainRes);
    await poller.pollUntilDone();

    console.log(`LargePersonGroup ${faceConfig.personGroupId} training complete`);
}

/**
 * Detect a single face in the given image buffer. Returns the faceId.
 * Throws if zero or multiple faces are detected.
 */
export async function detectSingleFace(imageBuffer: Buffer): Promise<string> {
    const faceConfig = getFaceConfig();
    const res = await getClient().path("/detect").post({
        contentType: "application/octet-stream",
        queryParameters: {
            detectionModel: DETECTION_MODEL,
            recognitionModel: faceConfig.recognitionModel,
            returnFaceId: true,
            faceIdTimeToLive: 120,
        },
        body: imageBuffer as unknown as Uint8Array,
    });

    if (isUnexpected(res)) {
        throw new Error(`Face detection failed: ${res.body.error.message}`);
    }

    const faces = res.body;

    if (!faces || faces.length === 0) {
        throw new FaceServiceError("NO_FACE_DETECTED", "No face detected in the image");
    }

    if (faces.length > 1) {
        throw new FaceServiceError(
            "MULTIPLE_FACES_DETECTED",
            `Expected 1 face, detected ${faces.length}. Please provide an image with a single face.`,
        );
    }

    return faces[0].faceId as string;
}

export interface IdentifyCandidate {
    personId: string;
    confidence: number;
}

/**
 * Identify a faceId against the LargePersonGroup.
 * Returns the best candidate above the confidence threshold, or null.
 */
export async function identifyFace(faceId: string): Promise<IdentifyCandidate | null> {
    const faceConfig = getFaceConfig();
    const res = await getClient().path("/identify").post({
        body: {
            faceIds: [faceId],
            largePersonGroupId: faceConfig.personGroupId,
            maxNumOfCandidatesReturned: 1,
            confidenceThreshold: faceConfig.confidenceThreshold,
        },
    });

    if (isUnexpected(res)) {
        throw new Error(`Face identification failed: ${res.body.error.message}`);
    }

    const results = res.body;
    if (!results || results.length === 0 || results[0].candidates.length === 0) {
        return null;
    }

    const best = results[0].candidates[0];
    return { personId: best.personId, confidence: best.confidence };
}

/**
 * A typed error for business-logic face errors (no face, multiple faces, etc.)
 */
export class FaceServiceError extends Error {
    constructor(
        public readonly code: string,
        message: string,
    ) {
        super(message);
        this.name = "FaceServiceError";
    }
}
