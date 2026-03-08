import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type Pose = 'front' | 'left' | 'right' | 'unknown';

// Landmark indices
const NOSE_TIP = 1;
const LEFT_EAR_TRAGION = 234;
const RIGHT_EAR_TRAGION = 454;

// Key landmarks for stability tracking (nose, chin, forehead, left/right cheek)
const STABILITY_LANDMARKS = [1, 152, 10, 234, 454, 33, 263, 61, 291];

export function calculateYawAngle(landmarks: NormalizedLandmark[]): number {
  const nose = landmarks[NOSE_TIP];
  const leftEar = landmarks[LEFT_EAR_TRAGION];
  const rightEar = landmarks[RIGHT_EAR_TRAGION];

  const earMidX = (leftEar.x + rightEar.x) / 2;
  const earDistance = Math.abs(rightEar.x - leftEar.x);

  if (earDistance < 0.001) return 0;

  // Positive yaw = turned right (in raw/unmirrored coords)
  const yaw = ((nose.x - earMidX) / earDistance) * 90;
  return yaw;
}

export function determinePose(yaw: number): Pose {
  const absYaw = Math.abs(yaw);
  if (absYaw < 10) return 'front';
  if (absYaw < 20) return 'unknown';
  // In raw camera coords: negative yaw appears as right turn in mirrored video
  // Swap so labels match what the user sees in the mirrored preview
  if (yaw < -20) return 'right';
  if (yaw > 20) return 'left';
  return 'unknown';
}

export function calculateStability(
  current: NormalizedLandmark[],
  previous: NormalizedLandmark[]
): number {
  let totalDist = 0;
  for (const idx of STABILITY_LANDMARKS) {
    const c = current[idx];
    const p = previous[idx];
    const dx = c.x - p.x;
    const dy = c.y - p.y;
    totalDist += Math.sqrt(dx * dx + dy * dy);
  }
  return totalDist / STABILITY_LANDMARKS.length;
}

// Chin and forehead for vertical face center
const CHIN = 152;
const FOREHEAD = 10;

export function isFaceCentered(
  landmarks: NormalizedLandmark[],
  _width: number,
  _height: number,
  pose?: Pose
): boolean {
  // For turned poses, use midpoint of face bounding landmarks instead of nose
  // (nose shifts off-center when head is turned)
  const nose = landmarks[NOSE_TIP];
  const leftEar = landmarks[LEFT_EAR_TRAGION];
  const rightEar = landmarks[RIGHT_EAR_TRAGION];
  const chin = landmarks[CHIN];
  const forehead = landmarks[FOREHEAD];

  // Face center: midpoint between ears (X) and forehead/chin (Y)
  const faceCenterX = (leftEar.x + rightEar.x) / 2;
  const faceCenterY = (forehead.y + chin.y) / 2;

  // Use face center for turned poses, nose for front
  const isTurned = pose === 'left' || pose === 'right';
  const checkX = isTurned ? faceCenterX : nose.x;
  const checkY = isTurned ? faceCenterY : nose.y;

  // Check point is within center region of frame
  const marginX = isTurned ? 0.25 : 0.35; // more lenient horizontally for turns
  const marginY = 0.30;
  const inCenterX = checkX > marginX && checkX < 1 - marginX;
  const inCenterY = checkY > marginY && checkY < 1 - marginY;

  // Check face size using vertical height (forehead to chin) — robust to turns
  const faceHeight = Math.abs(chin.y - forehead.y);
  const goodSize = faceHeight > 0.12 && faceHeight < 0.7;

  return inCenterX && inCenterY && goodSize;
}

/**
 * Crop face from a canvas using landmarks. Returns a Blob of the cropped face
 * with generous padding (forehead to below chin, ear to ear + margin).
 */
export function cropFaceFromCanvas(
  canvas: HTMLCanvasElement,
  landmarks: NormalizedLandmark[],
  padding = 0.5
): Promise<Blob | null> {
  const w = canvas.width;
  const h = canvas.height;

  // Find bounding box from all landmarks
  let minX = 1, maxX = 0, minY = 1, maxY = 0;
  for (const lm of landmarks) {
    if (lm.x < minX) minX = lm.x;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.y > maxY) maxY = lm.y;
  }

  // Add padding
  const faceW = maxX - minX;
  const faceH = maxY - minY;
  const padX = faceW * padding;
  const padY = faceH * padding;

  const cropX = Math.max(0, Math.floor((minX - padX) * w));
  const cropY = Math.max(0, Math.floor((minY - padY) * h));
  const cropW = Math.min(w - cropX, Math.ceil((maxX - minX + padX * 2) * w));
  const cropH = Math.min(h - cropY, Math.ceil((maxY - minY + padY * 2) * h));

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const ctx = cropCanvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);

  ctx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return compressToJpeg(cropCanvas);
}

const MAX_IMAGE_SIZE = 480;
const JPEG_QUALITY = 0.75;

/**
 * Resize a canvas to max MAX_IMAGE_SIZE on longest side and encode as jpeg.
 */
export function compressToJpeg(
  source: HTMLCanvasElement,
  maxSize = MAX_IMAGE_SIZE,
  quality = JPEG_QUALITY
): Promise<Blob | null> {
  let { width, height } = source;

  if (width > maxSize || height > maxSize) {
    const scale = maxSize / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  if (!ctx) return Promise.resolve(null);

  ctx.drawImage(source, 0, 0, width, height);

  return new Promise((resolve) => {
    out.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}
