# Face API Documentation

Base path: `/api/face`

All endpoints accept and return JSON unless noted otherwise.

---

## GET `/api/face/health`

Check if the Face API is running.

**Response `200`**
```json
{
  "success": true,
  "message": "Face API is healthy"
}
```

---

## POST `/api/face/enroll`

Enroll a new person by uploading one or more face images. The person is registered in Azure Face and persisted in the database.

**Request** `multipart/form-data`

| Field    | Type      | Required | Description                                      |
|----------|-----------|----------|--------------------------------------------------|
| `name`   | `string`  | Yes      | Full name of the person to enroll                |
| `images` | `File[]`  | Yes      | 1 to `maxImages` face images (see limits below)  |

**Image constraints**
- Allowed MIME types: `image/jpeg`, `image/png`, `image/bmp`, `image/gif`
- Max file size: **6 MB** per image
- Max number of images: configured via `FACE_MAX_IMAGES` env var (default: `10`)
- Each image must contain exactly **one** detectable face

**Response `201` — Success**
```json
{
  "success": true,
  "message": "Person enrolled successfully",
  "data": {
    "personId": "<mongodb-object-id>",
    "name": "Jane Doe",
    "azurePersonId": "<azure-uuid>",
    "enrolledAt": "2026-03-07T12:00:00.000Z",
    "facesAdded": 2
  }
}
```

**Error responses**

| Status | `code`                    | Cause                                              |
|--------|---------------------------|----------------------------------------------------|
| `400`  | —                         | Missing/empty `name`, no images, or too many images |
| `422`  | `NO_FACE_DETECTED`        | An image contained no detectable face              |
| `422`  | `MULTIPLE_FACES_DETECTED` | An image contained more than one face              |
| `500`  | —                         | Unexpected server error                            |

---

## POST `/api/face/verify`

Identify a person from a single face image.

**Request** `multipart/form-data`

| Field   | Type    | Required | Description               |
|---------|---------|----------|---------------------------|
| `image` | `File`  | Yes      | A single face image       |

Same image constraints as `/enroll` apply.

**Response `200` — Match found**
```json
{
  "success": true,
  "message": "Person verified successfully",
  "data": {
    "personId": "<mongodb-object-id>",
    "name": "Jane Doe",
    "azurePersonId": "<azure-uuid>",
    "enrolledAt": "2026-03-07T12:00:00.000Z",
    "confidence": 0.87
  }
}
```

`confidence` is a value between `0` and `1`. Only candidates above the configured threshold (default `0.6`, env var `FACE_CONFIDENCE_THRESHOLD`) are returned.

**Error responses**

| Status | `code`                    | Cause                                                        |
|--------|---------------------------|--------------------------------------------------------------|
| `400`  | —                         | No image provided                                            |
| `404`  | `UNKNOWN_FACE`            | No enrolled person matched above the confidence threshold    |
| `404`  | `USER_NOT_FOUND`          | Azure matched a person but no local DB record exists         |
| `422`  | `NO_FACE_DETECTED`        | Image contained no detectable face                           |
| `422`  | `MULTIPLE_FACES_DETECTED` | Image contained more than one face                           |
| `500`  | —                         | Unexpected server error                                      |

---

## Environment variables

| Variable                   | Required | Default          | Description                                      |
|----------------------------|----------|------------------|--------------------------------------------------|
| `FACE_ENDPOINT`            | Yes      | —                | Azure Face API endpoint URL                      |
| `FACE_API_KEY`             | Yes      | —                | Azure Face API key                               |
| `FACE_RECOGNITION_MODEL`   | No       | `recognition_04` | Azure recognition model version                  |
| `FACE_PERSON_GROUP_ID`     | No       | `hacktech-2026`  | ID of the LargePersonGroup in Azure              |
| `FACE_CONFIDENCE_THRESHOLD`| No       | `0.6`            | Minimum confidence score to accept a match       |
| `FACE_MAX_IMAGES`          | No       | `10`             | Maximum number of images allowed per enrollment  |

---

## Example usage

### Enroll
```bash
curl -X POST http://localhost:3000/api/face/enroll \
  -F "name=Jane Doe" \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg"
```

### Verify
```bash
curl -X POST http://localhost:3000/api/face/verify \
  -F "image=@photo.jpg"
```
