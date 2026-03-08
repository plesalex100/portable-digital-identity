import { useState, useEffect, useRef, useCallback, type RefObject } from 'react';
import { FaceLandmarker, FilesetResolver, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import {
  calculateYawAngle,
  determinePose,
  calculateStability,
  isFaceCentered,
  type Pose,
} from '@/lib/faceDetectionUtils';

interface UseFaceDetectionOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  enabled: boolean;
}

interface FaceDetectionResult {
  isModelLoaded: boolean;
  faceDetected: boolean;
  faceCount: number;
  currentPose: Pose | null;
  yawAngle: number;
  isStable: boolean;
  isCentered: boolean;
  /** Latest face landmarks for cropping — null when no face */
  faceLandmarks: NormalizedLandmark[] | null;
}

const STABILITY_THRESHOLD = 0.005;
const STABILITY_BUFFER_SIZE = 10;
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export function useFaceDetection({ videoRef, enabled }: UseFaceDetectionOptions): FaceDetectionResult {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [currentPose, setCurrentPose] = useState<Pose | null>(null);
  const [yawAngle, setYawAngle] = useState(0);
  const [isStable, setIsStable] = useState(false);
  const [isCenteredState, setIsCenteredState] = useState(false);
  const [faceLandmarksState, setFaceLandmarksState] = useState<NormalizedLandmark[] | null>(null);

  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef<number>(0);
  const landmarkBufferRef = useRef<NormalizedLandmark[][]>([]);
  const frameCountRef = useRef(0);
  const lastTimestampRef = useRef(-1);

  // Initialize FaceLandmarker
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        if (cancelled) return;

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFacialTransformationMatrixes: false,
          outputFaceBlendshapes: false,
        });

        if (cancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setIsModelLoaded(true);
      } catch (err) {
        console.error('Failed to load face landmarker:', err);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
      setIsModelLoaded(false);
    };
  }, [enabled]);

  // Detection loop
  const detect = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }

    const now = performance.now();
    // Avoid duplicate timestamps
    if (now <= lastTimestampRef.current) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }
    lastTimestampRef.current = now;

    try {
      const results = landmarker.detectForVideo(video, now);
      frameCountRef.current++;

      const detectedCount = results.faceLandmarks ? results.faceLandmarks.length : 0;
      const hasface = detectedCount > 0;

      // Throttle state updates to every 3 frames
      if (frameCountRef.current % 3 === 0) {
        setFaceCount(detectedCount);
        if (!hasface) {
          setFaceDetected(false);
          setCurrentPose(null);
          setYawAngle(0);
          setIsStable(false);
          setIsCenteredState(false);
          setFaceLandmarksState(null);
          landmarkBufferRef.current = [];
        } else {
          const landmarks = results.faceLandmarks[0];

          setFaceDetected(true);
          setFaceLandmarksState(landmarks);

          const yaw = calculateYawAngle(landmarks);
          setYawAngle(yaw);
          const pose = determinePose(yaw);
          setCurrentPose(pose);

          const centered = isFaceCentered(landmarks, video.videoWidth, video.videoHeight, pose);
          setIsCenteredState(centered);

          // Stability: compare with buffer
          const buffer = landmarkBufferRef.current;
          buffer.push(landmarks);
          if (buffer.length > STABILITY_BUFFER_SIZE) {
            buffer.shift();
          }

          if (buffer.length >= 5) {
            // Check stability across last 5 frames
            let maxMovement = 0;
            for (let i = buffer.length - 5; i < buffer.length - 1; i++) {
              const movement = calculateStability(buffer[i + 1], buffer[i]);
              maxMovement = Math.max(maxMovement, movement);
            }
            setIsStable(maxMovement < STABILITY_THRESHOLD);
          } else {
            setIsStable(false);
          }
        }
      }
    } catch {
      // Detection can fail on invalid frames, just continue
    }

    rafRef.current = requestAnimationFrame(detect);
  }, [videoRef]);

  // Start/stop detection loop
  useEffect(() => {
    if (!enabled || !isModelLoaded) return;

    frameCountRef.current = 0;
    lastTimestampRef.current = -1;
    landmarkBufferRef.current = [];
    rafRef.current = requestAnimationFrame(detect);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, isModelLoaded, detect]);

  return {
    isModelLoaded,
    faceDetected,
    faceCount,
    currentPose,
    yawAngle,
    isStable,
    isCentered: isCenteredState,
    faceLandmarks: faceLandmarksState,
  };
}
