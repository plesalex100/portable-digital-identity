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
