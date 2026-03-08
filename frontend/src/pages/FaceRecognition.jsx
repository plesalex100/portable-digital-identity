import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { enrollFace } from '../api';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Camera, Check, Loader2, ArrowLeft, ArrowRight, ScanFace, Crosshair, CircleDot } from 'lucide-react';
import { getSession } from '@/lib/session';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { cropFaceFromCanvas } from '@/lib/faceDetectionUtils';
import { useWebHaptics } from 'web-haptics/react';

const POSES = [
  { key: 'front', label: 'Look straight ahead' },
  { key: 'left', label: 'Turn head left' },
  { key: 'right', label: 'Turn head right' },
];

const POSE_HOLD_MS = 300; // Brief hold to avoid accidental captures

export default function FaceRecognition() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state?.userData || getSession();

  useEffect(() => {
    if (!userData) navigate('/', { replace: true });
  }, []);

  if (!userData) return null;

  const { trigger: haptic } = useWebHaptics();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const poseTimerRef = useRef(null);
  const capturedImagesRef = useRef([]);

  // Stages: idle | loading-model | pose-front | pose-left | pose-right | uploading | complete | error | duplicate
  const [scanStage, setScanStage] = useState('idle');
  const [capturedImages, setCapturedImages] = useState([]);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [poseHoldProgress, setPoseHoldProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState(null);

  const isPoseStage = scanStage.startsWith('pose-');
  const detectionEnabled = cameraReady && (isPoseStage || scanStage === 'loading-model');

  const { isModelLoaded, faceDetected, currentPose, isCentered, faceLandmarks } = useFaceDetection({
    videoRef,
    enabled: detectionEnabled,
  });
  const faceLandmarksRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.75);
    });
  }, []);

  // Start camera on mount
  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraReady(true);
        setScanStage('loading-model');
      } catch (err) {
        console.error('Camera access denied:', err);
        if (!cancelled) {
          setErrorMsg('Camera access denied. Please allow camera access.');
          setScanStage('error');
        }
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [stopCamera]);

  // Transition from loading-model to first pose when model is ready
  useEffect(() => {
    if (scanStage === 'loading-model' && isModelLoaded) {
      setScanStage('pose-front');
    }
  }, [scanStage, isModelLoaded]);

  const playChime = useCallback((type = 'step') => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (type === 'step') {
        // Quick ding
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
        osc.onended = () => ctx.close();
      } else {
        // Success: ascending ding-ding-ding
        [880, 1100, 1320].forEach((freq, i) => {
          const g = ctx.createGain();
          g.connect(ctx.destination);
          const o = ctx.createOscillator();
          o.connect(g);
          o.frequency.value = freq;
          o.type = 'sine';
          const t = ctx.currentTime + i * 0.1;
          g.gain.setValueAtTime(0.2, t);
          g.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
          o.start(t);
          o.stop(t + 0.25);
          if (i === 2) o.onended = () => ctx.close();
        });
      }
    } catch (e) { /* audio not available */ }
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    capturedImagesRef.current = capturedImages;
  }, [capturedImages]);
  useEffect(() => {
    faceLandmarksRef.current = faceLandmarks;
  }, [faceLandmarks]);

  // Clear timer when pose stage changes
  useEffect(() => {
    return () => {
      if (poseTimerRef.current) {
        clearTimeout(poseTimerRef.current);
        poseTimerRef.current = null;
      }
    };
  }, [scanStage]);

  // Handle pose detection and auto-capture
  useEffect(() => {
    if (!isPoseStage) {
      setPoseHoldProgress(0);
      return;
    }

    const expectedPose = POSES[currentPoseIndex].key;
    const poseMatches = currentPose === expectedPose && faceDetected && isCentered;

    if (poseMatches) {
      if (!poseTimerRef.current) {
        const startTime = Date.now();
        const progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          setPoseHoldProgress(Math.min(elapsed / POSE_HOLD_MS, 1));
        }, 50);

        poseTimerRef.current = setTimeout(async () => {
          clearInterval(progressInterval);
          setPoseHoldProgress(1);
          poseTimerRef.current = null;

          // Capture and crop to face
          const fullBlob = await capturePhoto();
          if (fullBlob) {
            // Freeze the snapshot for display
            setSnapshotUrl(canvasRef.current.toDataURL('image/jpeg', 0.75));
            let blob = fullBlob;
            const landmarks = faceLandmarksRef.current;
            if (landmarks && canvasRef.current) {
              const cropped = await cropFaceFromCanvas(canvasRef.current, landmarks);
              if (cropped) blob = cropped;
            }
            haptic('nudge');
            playChime('step');
            const newImages = [...capturedImagesRef.current, blob];
            setCapturedImages(newImages);
            capturedImagesRef.current = newImages;

            if (newImages.length >= 3) {
              // All poses captured, upload
              setScanStage('uploading');
              try {
                const response = await enrollFace(userData, newImages);
                if (response.code === 'ALREADY_CHECKED_IN') {
                  setErrorMsg(response.message || 'This passenger is already checked in');
                  setScanStage('duplicate');
                  haptic('nudge');
                  stopCamera();
                  setTimeout(() => navigate('/pass', { state: { userData } }), 2000);
                  return;
                }
                setScanStage('complete');
                haptic('success');
                playChime('success');
                stopCamera();
                setTimeout(() => navigate('/pass', { state: { userData } }), 1000);
              } catch (err) {
                if (err.code === 'ALREADY_CHECKED_IN') {
                  setErrorMsg(err.message || 'This passenger is already checked in');
                  setScanStage('duplicate');
                  haptic('nudge');
                  stopCamera();
                  setTimeout(() => navigate('/pass', { state: { userData } }), 2000);
                  return;
                }
                setErrorMsg(err.message || 'Enrollment failed');
                setScanStage('error');
                haptic('error');
                stopCamera();
              }
            } else {
              // Move to next pose — clear snapshot so live feed returns
              setSnapshotUrl(null);
              const nextIndex = currentPoseIndex + 1;
              setCurrentPoseIndex(nextIndex);
              setScanStage(`pose-${POSES[nextIndex].key}`);
              setPoseHoldProgress(0);
            }
          }
        }, POSE_HOLD_MS);
      }
    } else {
      // Pose doesn't match, reset timer
      if (poseTimerRef.current) {
        clearTimeout(poseTimerRef.current);
        poseTimerRef.current = null;
      }
      setPoseHoldProgress(0);
    }
  }, [isPoseStage, currentPose, faceDetected, isCentered, currentPoseIndex]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      clearTimeout(poseTimerRef.current);
    };
  }, []);

  const progress = scanStage === 'uploading' || scanStage === 'complete'
    ? 100
    : ((capturedImages.length + poseHoldProgress) / 3) * 100;

  const circumference = 2 * Math.PI * 145;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const ringColor = scanStage === 'complete' ? '#22c55e'
    : scanStage === 'error' ? '#f87171'
    : scanStage === 'duplicate' ? '#f59e0b'
    : '#FACD2C';

  const glowColor = scanStage === 'complete' ? 'shadow-emerald-500/30'
    : scanStage === 'error' ? 'shadow-red-500/30'
    : scanStage === 'duplicate' ? 'shadow-amber-500/30'
    : 'shadow-primary/20';

  const statusText = () => {
    if (scanStage === 'idle') return 'Starting camera...';
    if (scanStage === 'loading-model') return 'Loading face detection...';
    if (scanStage === 'uploading') return 'Processing...';
    if (scanStage === 'complete') return 'Biometric pass created!';
    if (scanStage === 'error') return 'Enrollment failed';
    if (scanStage === 'duplicate') return 'Already checked in';
    if (isPoseStage) {
      if (!faceDetected) return 'No face detected';
      if (!isCentered) return 'Move closer to center';
      if (currentPose !== POSES[currentPoseIndex].key) return POSES[currentPoseIndex].label;
      return 'Hold still...';
    }
    return '';
  };

  const statusColor = scanStage === 'complete' ? 'text-emerald-600'
    : scanStage === 'error' ? 'text-red-500'
    : scanStage === 'duplicate' ? 'text-amber-500'
    : 'text-primary';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col h-full w-full relative overflow-hidden"
    >
      {/* Cloud background */}
      <div className="absolute inset-0 z-0">
        <img src="/bg-image.jpg" alt="" className="w-full h-full object-cover opacity-20 animate-drift" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="relative z-10 flex flex-col items-center flex-1 px-6 pt-8 pb-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2.5 mb-2"
        >
          <img src="/logo.svg" alt="SkyGate" className="w-8 h-8" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">SkyGate Airways</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display text-xl font-semibold text-foreground"
        >
          Biometric Scan
        </motion.h2>

        {/* Status text - only show for non-pose stages */}
        {!isPoseStage && (
          <div className="mt-2 h-7 flex justify-center items-center">
            <p className={`text-base font-semibold transition-colors duration-300 ${statusColor}`}>
              {statusText()}
            </p>
          </div>
        )}

        {/* Pose instruction pill */}
        <div className={`${isPoseStage ? 'mt-2' : ''} h-8`}>
          <AnimatePresence mode="wait">
            {isPoseStage && (
              <motion.div
                key={currentPoseIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2 bg-foreground/90 text-white px-4 py-1.5 rounded-full"
              >
                {POSES[currentPoseIndex].key === 'front' && <ScanFace className="w-4 h-4" />}
                {POSES[currentPoseIndex].key === 'left' && <ArrowLeft className="w-4 h-4" />}
                {POSES[currentPoseIndex].key === 'right' && <ArrowRight className="w-4 h-4" />}
                <span className="text-sm font-semibold tracking-tight">
                  {POSES[currentPoseIndex].label}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mb-6" />

        {/* Camera view with ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
          className="relative w-[300px] h-[300px] flex items-center justify-center"
        >
          {/* Outer glow */}
          <div className={`absolute inset-0 rounded-full blur-3xl opacity-15 transition-colors duration-1000 ${
            scanStage === 'complete' ? 'bg-emerald-500' : scanStage === 'error' ? 'bg-red-500' : scanStage === 'duplicate' ? 'bg-amber-500' : 'bg-primary'
          }`} />

          {/* Progress Ring */}
          <svg className="absolute w-[310px] h-[310px] -rotate-90 z-20 pointer-events-none" viewBox="0 0 320 320">
            <circle
              cx="160" cy="160" r="145"
              stroke="rgba(232, 224, 208, 0.5)" strokeWidth="4" fill="none"
            />
            <circle
              cx="160" cy="160" r="145"
              stroke={ringColor}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
                transition: 'stroke-dashoffset 0.3s ease-out',
                filter: `drop-shadow(0 0 6px ${ringColor}40)`,
              }}
            />
          </svg>

          {/* Camera circle */}
          <div className={`relative w-[280px] h-[280px] rounded-full overflow-hidden border-2 border-white bg-muted z-10 flex items-center justify-center shadow-xl ${glowColor}`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-all duration-500 ${
                snapshotUrl && !isPoseStage ? 'blur-sm opacity-30' : ''
              }`}
            />

            {/* Frozen snapshot after capture */}
            {snapshotUrl && !isPoseStage && (
              <img
                src={snapshotUrl}
                alt="Captured"
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-5"
              />
            )}

            {/* Scanning line during pose stages */}
            {isPoseStage && faceDetected && (
              <motion.div
                animate={{ y: ["-100%", "300%", "-100%"] }}
                transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
                className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-transparent via-primary/15 to-primary/40 border-b-2 border-primary/70 z-30 pointer-events-none"
              />
            )}

            {/* Directional overlay on webcam */}
            <AnimatePresence mode="wait">
              {isPoseStage && (
                <motion.div
                  key={`overlay-${currentPoseIndex}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 z-25 pointer-events-none flex items-center justify-center"
                >
                  {/* Pose-specific directional cue */}
                  {POSES[currentPoseIndex].key === 'front' && !faceDetected && (
                    <div className="flex flex-col items-center gap-2">
                      <ScanFace className="w-16 h-16 text-white/70" strokeWidth={1.2} />
                      <span className="text-white/80 text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
                        Position your face here
                      </span>
                    </div>
                  )}

                  {POSES[currentPoseIndex].key === 'front' && faceDetected && !isCentered && (
                    <div className="flex flex-col items-center gap-2">
                      <Crosshair className="w-10 h-10 text-white/80 animate-pulse" strokeWidth={1.5} />
                      <span className="text-white/90 text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
                        Move to center
                      </span>
                    </div>
                  )}

                  {POSES[currentPoseIndex].key === 'front' && faceDetected && isCentered && currentPose === 'front' && (
                    <div className="flex flex-col items-center">
                      <CircleDot className="w-10 h-10 text-emerald-400/90" strokeWidth={1.5} />
                      <span className="text-white/90 text-xs font-medium bg-black/40 px-3 py-1 rounded-full mt-2">
                        Hold still
                      </span>
                    </div>
                  )}

                  {POSES[currentPoseIndex].key === 'left' && faceDetected && currentPose !== 'left' && (
                    <motion.div
                      animate={{ x: [-4, -12, -4] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute left-6 flex items-center gap-2"
                    >
                      <ArrowLeft className="w-16 h-16 text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" strokeWidth={2.5} />
                    </motion.div>
                  )}

                  {POSES[currentPoseIndex].key === 'left' && faceDetected && currentPose === 'left' && isCentered && (
                    <div className="absolute left-6 flex items-center">
                      <Check className="w-10 h-10 text-emerald-400/90" strokeWidth={2.5} />
                    </div>
                  )}

                  {POSES[currentPoseIndex].key === 'right' && faceDetected && currentPose !== 'right' && (
                    <motion.div
                      animate={{ x: [4, 12, 4] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute right-6 flex items-center gap-2"
                    >
                      <ArrowRight className="w-16 h-16 text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" strokeWidth={2.5} />
                    </motion.div>
                  )}

                  {POSES[currentPoseIndex].key === 'right' && faceDetected && currentPose === 'right' && isCentered && (
                    <div className="absolute right-6 flex items-center">
                      <Check className="w-10 h-10 text-emerald-400/90" strokeWidth={2.5} />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Corner markers */}
            <div className="absolute inset-4 pointer-events-none z-20">
              {[
                'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
                'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
                'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
                'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg',
              ].map((pos, i) => (
                <div key={i} className={`absolute w-8 h-8 ${pos} border-white/60`} />
              ))}
            </div>

            {/* Uploading overlay */}
            {scanStage === 'uploading' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-30"
              >
                <Loader2 className="w-10 h-10 text-white animate-spin" />
                <span className="text-white text-sm font-medium mt-2">Processing...</span>
              </motion.div>
            )}

            {/* Success overlay */}
            {scanStage === 'complete' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-emerald-500/80 flex flex-col items-center justify-center z-30"
              >
                <ShieldCheck className="w-14 h-14 text-white" strokeWidth={1.5} />
                <span className="text-white text-sm font-bold mt-2">Verified</span>
              </motion.div>
            )}

          </div>
        </motion.div>

        {/* Pose progress dots */}
        <div className="flex items-center gap-3 mt-5">
          {POSES.map((pose, i) => (
            <div key={pose.key} className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                i < capturedImages.length
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : i === currentPoseIndex && isPoseStage
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-border text-muted-foreground bg-background'
              }`}>
                {i < capturedImages.length ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              {i < POSES.length - 1 && (
                <div className={`w-6 h-0.5 ${i < capturedImages.length ? 'bg-emerald-500' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1.5">
          {isPoseStage ? `Step ${currentPoseIndex + 1} of 3` : scanStage === 'complete' ? 'All steps complete' : ''}
        </div>

        {/* Passenger name tag */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-center"
        >
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Passenger</div>
          <div className="text-sm font-bold text-foreground">{userData.fullName}</div>
        </motion.div>

        {/* Bottom status area */}
        <div className="mt-auto pt-4 w-full text-center">
          {scanStage === 'duplicate' ? (
            <div className="space-y-2">
              <p className="text-sm text-amber-500 font-medium">{errorMsg}</p>
              <p className="text-xs text-muted-foreground">Redirecting to your boarding pass...</p>
            </div>
          ) : scanStage === 'error' ? (
            <div className="space-y-3">
              <p className="text-sm text-red-500">{errorMsg}</p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => window.location.reload()}
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                Retry
              </Button>
            </div>
          ) : scanStage === 'loading-model' ? (
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading face detection model...
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {isPoseStage ? 'Follow the on-screen directions' : 'Hold still and look at the camera'}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
