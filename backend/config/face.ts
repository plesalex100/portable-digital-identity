export interface FaceConfig {
    endpoint: string;
    apiKey: string;
    recognitionModel: "recognition_01" | "recognition_02" | "recognition_03" | "recognition_04";
    personGroupId: string;
    confidenceThreshold: number;
    maxImages: number;
}

let _config: FaceConfig | null = null;

export function getFaceConfig(): FaceConfig {
    if (_config) return _config;

    const {
        FACE_ENDPOINT,
        FACE_API_KEY,
        FACE_RECOGNITION_MODEL,
        FACE_PERSON_GROUP_ID,
        FACE_CONFIDENCE_THRESHOLD,
        FACE_MAX_IMAGES,
    } = process.env;

    if (!FACE_ENDPOINT || !FACE_API_KEY) {
        throw new Error("Please provide FACE_ENDPOINT and FACE_API_KEY in the .env file");
    }

    _config = {
        endpoint: FACE_ENDPOINT,
        apiKey: FACE_API_KEY,
        recognitionModel: (FACE_RECOGNITION_MODEL || "recognition_04") as FaceConfig["recognitionModel"],
        personGroupId: FACE_PERSON_GROUP_ID || "hacktech-2026",
        confidenceThreshold: parseFloat(FACE_CONFIDENCE_THRESHOLD || "0.6"),
        maxImages: parseInt(FACE_MAX_IMAGES || "10", 10),
    };

    return _config;
}
