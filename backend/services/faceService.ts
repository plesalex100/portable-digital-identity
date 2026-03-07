import {
    RekognitionClient,
    CompareFacesCommand,
    DetectFacesCommand,
} from "@aws-sdk/client-rekognition";
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getFaceConfig } from "../config/face.js";

let _rekognitionClient: RekognitionClient | null = null;
let _s3Client: S3Client | null = null;

function getRekognitionClient(): RekognitionClient {
    if (!_rekognitionClient) {
        const config = getFaceConfig();
        _rekognitionClient = new RekognitionClient({
            region: config.awsRegion,
            credentials: {
                accessKeyId: config.awsAccessKeyId,
                secretAccessKey: config.awsSecretAccessKey,
            },
        });
    }
    return _rekognitionClient;
}

function getS3Client(): S3Client {
    if (!_s3Client) {
        const config = getFaceConfig();
        _s3Client = new S3Client({
            region: config.awsRegion,
            credentials: {
                accessKeyId: config.awsAccessKeyId,
                secretAccessKey: config.awsSecretAccessKey,
            },
        });
    }
    return _s3Client;
}

/**
 * Detect faces in an image buffer. Throws if zero or multiple faces are found.
 */
export async function detectSingleFace(imageBuffer: Buffer): Promise<void> {
    const command = new DetectFacesCommand({
        Image: { Bytes: imageBuffer },
        Attributes: ["DEFAULT"],
    });

    const response = await getRekognitionClient().send(command);
    const faces = response.FaceDetails ?? [];

    if (faces.length === 0) {
        throw new FaceServiceError("NO_FACE_DETECTED", "No face detected in the image");
    }

    if (faces.length > 1) {
        throw new FaceServiceError(
            "MULTIPLE_FACES_DETECTED",
            `Expected 1 face, detected ${faces.length}. Please provide an image with a single face.`,
        );
    }
}

/**
 * Upload an enrolled face image to S3 under the person's folder.
 * Key format: faces/{personId}/{faceIndex}.jpg
 * Returns the S3 key.
 */
export async function uploadFaceImage(
    personId: string,
    faceIndex: number,
    imageBuffer: Buffer,
): Promise<string> {
    const config = getFaceConfig();
    const key = `faces/${personId}/${faceIndex}.jpg`;

    const command = new PutObjectCommand({
        Bucket: config.s3Bucket,
        Key: key,
        Body: imageBuffer,
        ContentType: "image/jpeg",
    });

    await getS3Client().send(command);
    console.log(`Uploaded face image to S3: ${key}`);
    return key;
}

/**
 * Download a face image from S3 and return it as a Buffer.
 */
async function downloadFaceImage(key: string): Promise<Buffer> {
    const config = getFaceConfig();

    const command = new GetObjectCommand({
        Bucket: config.s3Bucket,
        Key: key,
    });

    const response = await getS3Client().send(command);

    if (!response.Body) {
        throw new Error(`Empty body when downloading S3 object: ${key}`);
    }

    // Convert the readable stream to a Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

/**
 * List all face image S3 keys for a given person.
 */
async function listFaceKeys(personId: string): Promise<string[]> {
    const config = getFaceConfig();
    const prefix = `faces/${personId}/`;

    const command = new ListObjectsV2Command({
        Bucket: config.s3Bucket,
        Prefix: prefix,
    });

    const response = await getS3Client().send(command);
    return (response.Contents ?? []).map((obj) => obj.Key!).filter(Boolean);
}

/**
 * List ALL enrolled person IDs by scanning the faces/ prefix in S3.
 * Returns unique person IDs.
 */
async function listAllPersonIds(): Promise<string[]> {
    const config = getFaceConfig();

    const command = new ListObjectsV2Command({
        Bucket: config.s3Bucket,
        Prefix: "faces/",
        Delimiter: "/",
    });

    // Using delimiter with prefix gives us CommonPrefixes for each "folder"
    const response = await getS3Client().send(command);
    const prefixes = response.CommonPrefixes ?? [];

    return prefixes
        .map((p) => p.Prefix!) // e.g. "faces/abc123/"
        .filter(Boolean)
        .map((p) => p.replace("faces/", "").replace(/\/$/, "")); // → "abc123"
}

export interface CompareResult {
    personId: string;
    confidence: number;
}

/**
 * Compare the given face image against all enrolled faces.
 * Uses AWS Rekognition CompareFaces to find the best match.
 * Returns the best matching personId + confidence, or null if no match is found.
 */
export async function compareFaceAgainstEnrolled(
    imageBuffer: Buffer,
): Promise<CompareResult | null> {
    const config = getFaceConfig();
    const personIds = await listAllPersonIds();

    if (personIds.length === 0) {
        return null;
    }

    let bestMatch: CompareResult | null = null;

    for (const personId of personIds) {
        const faceKeys = await listFaceKeys(personId);

        for (const key of faceKeys) {
            try {
                const enrolledImage = await downloadFaceImage(key);

                const command = new CompareFacesCommand({
                    SourceImage: { Bytes: imageBuffer },
                    TargetImage: { Bytes: enrolledImage },
                    SimilarityThreshold: config.confidenceThreshold,
                });

                const response = await getRekognitionClient().send(command);
                const matches = response.FaceMatches ?? [];

                for (const match of matches) {
                    const similarity = match.Similarity ?? 0;
                    if (!bestMatch || similarity > bestMatch.confidence) {
                        bestMatch = { personId, confidence: similarity };
                    }
                }
            } catch (err) {
                // Skip images that fail comparison (e.g. no face in enrolled image)
                console.warn(`CompareFaces failed for ${key}:`, (err as Error).message);
            }
        }
    }

    return bestMatch;
}

/**
 * Enroll a face: validate the image, upload to S3.
 * Returns the S3 keys of the uploaded images.
 */
export async function enrollFace(
    personId: string,
    imageBuffers: Buffer[],
): Promise<string[]> {
    const uploadedKeys: string[] = [];

    for (let i = 0; i < imageBuffers.length; i++) {
        // Validate each image has exactly one face
        await detectSingleFace(imageBuffers[i]);

        // Upload to S3
        const key = await uploadFaceImage(personId, i, imageBuffers[i]);
        uploadedKeys.push(key);
    }

    return uploadedKeys;
}

/**
 * Delete all enrolled face images for a person from S3.
 */
export async function deletePersonFaces(personId: string): Promise<void> {
    const config = getFaceConfig();
    const keys = await listFaceKeys(personId);

    if (keys.length === 0) return;

    const command = new DeleteObjectsCommand({
        Bucket: config.s3Bucket,
        Delete: {
            Objects: keys.map((key) => ({ Key: key })),
        },
    });

    await getS3Client().send(command);
    console.log(`Deleted ${keys.length} face images for person ${personId}`);
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
