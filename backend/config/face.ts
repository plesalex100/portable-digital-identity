export interface FaceConfig {
    awsRegion: string;
    awsAccessKeyId: string;
    awsSecretAccessKey: string;
    s3Bucket: string;
    confidenceThreshold: number;
    maxImages: number;
}

let _config: FaceConfig | null = null;

export function getFaceConfig(): FaceConfig {
    if (_config) return _config;

    const {
        AWS_REGION,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        AWS_S3_BUCKET,
        FACE_CONFIDENCE_THRESHOLD,
        FACE_MAX_IMAGES,
    } = process.env;

    if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
        throw new Error(
            "Please provide AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET in the .env file",
        );
    }

    _config = {
        awsRegion: AWS_REGION,
        awsAccessKeyId: AWS_ACCESS_KEY_ID,
        awsSecretAccessKey: AWS_SECRET_ACCESS_KEY,
        s3Bucket: AWS_S3_BUCKET,
        confidenceThreshold: parseFloat(FACE_CONFIDENCE_THRESHOLD || "90"),
        maxImages: parseInt(FACE_MAX_IMAGES || "10", 10),
    };

    return _config;
}
