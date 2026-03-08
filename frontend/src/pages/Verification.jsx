import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, AlertTriangle, Loader2, ScanFace, ArrowRight, Plane } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { verifyFace, getCheckpoints } from '../api';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { cropFaceFromCanvas } from '@/lib/faceDetectionUtils';
import { useWebHaptics } from 'web-haptics/react';

const READY_HOLD_MS = 300; // Brief hold to avoid accidental captures

const CHECKPOINTS = [
  { id: 'security-gate', label: 'Security Gate' },
  { id: 'immigration', label: 'Immigration Control' },
  { id: 'duty-free', label: 'Duty-Free Shops' },
  { id: 'lounge', label: 'Lounge Access' },
  { id: 'gate', label: 'Boarding Gate' },
];

// What to show as "next step" after each checkpoint
const NEXT_STEP = {
  'security-gate': { text: 'Proceed to Immigration Control' },
  immigration:     { text: 'Proceed to Gate', useGate: true },
  'duty-free':     { text: 'Proceed to Gate', useGate: true },
  lounge:          { text: 'Proceed to Gate', useGate: true },
  gate:            { text: 'Board your flight', useFlight: true },
};

export default function Verification() {
  const { trigger: haptic } = useWebHaptics();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const { checkpoint: checkpointParam } = useParams();

  const [checkpoints, setCheckpoints] = useState([]);
  const [loadingCheckpoints, setLoadingCheckpoints] = useState(true);

  useEffect(() => {
    getCheckpoints()
      .then(cps => setCheckpoints(cps))
      .catch(console.error)
      .finally(() => setLoadingCheckpoints(false));
  }, []);

  const checkpoint = checkpoints.find(cp => cp.id === checkpointParam) || 
    (checkpoints.length > 0 ? checkpoints[0] : { id: checkpointParam || 'security-gate', label: 'Loading...' });

  // idle | ready | scanning | verified | rejected | wrong-order | error
  const [stage, setStage] = useState('idle');
  const [cameraReady, setCameraReady] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [wrongOrderData, setWrongOrderData] = useState(null);
  const [snapshotUrl, setSnapshotUrl] = useState(null);

  const detectionEnabled = cameraReady && (stage === 'idle' || stage === 'ready');

  const { isModelLoaded, faceDetected, faceCount, currentPose, isCentered, isStable, faceLandmarks } = useFaceDetection({
    videoRef,
    enabled: detectionEnabled,
  });

  const readyTimerRef = useRef(null);
  const faceLandmarksRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
    } catch (err) {
      console.error('Camera access denied:', err);
      setErrorMsg('Camera access denied.');
      setStage('error');
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

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Transition idle -> ready when face detected
  useEffect(() => {
    if (stage === 'idle' && isModelLoaded && faceDetected) {
      setStage('ready');
    }
  }, [stage, isModelLoaded, faceDetected]);

  // Keep landmarks ref in sync
  useEffect(() => {
    faceLandmarksRef.current = faceLandmarks;
  }, [faceLandmarks]);

  // Transition ready -> idle if face disappears
  useEffect(() => {
    if (stage === 'ready' && !faceDetected) {
      clearTimeout(readyTimerRef.current);
      readyTimerRef.current = null;
      setStage('idle');
    }
  }, [stage, faceDetected]);

  // Ready conditions: single face, front-facing, centered, stable
  const readyToCapture = stage === 'ready' && faceDetected && currentPose === 'front' && isCentered && isStable;

  // Hold timer: must maintain ready conditions for READY_HOLD_MS before capturing
  useEffect(() => {
    if (readyToCapture) {
      if (!readyTimerRef.current) {
        readyTimerRef.current = setTimeout(() => {
          readyTimerRef.current = null;
          doScan();
        }, READY_HOLD_MS);
      }
    } else {
      if (readyTimerRef.current) {
        clearTimeout(readyTimerRef.current);
        readyTimerRef.current = null;
      }
    }
  }, [readyToCapture]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(readyTimerRef.current);
  }, []);

  const doScan = async () => {
    setStage('scanning');
    setResult(null);
    setErrorMsg('');
    setWrongOrderData(null);

    try {
      // Capture full frame then crop to face
      const fullBlob = await capturePhoto();
      if (!fullBlob) throw new Error('Failed to capture photo');

      // Freeze the snapshot for display
      setSnapshotUrl(canvasRef.current.toDataURL('image/jpeg', 0.75));

      let blob = fullBlob;
      const landmarks = faceLandmarksRef.current;
      if (landmarks && canvasRef.current) {
        const cropped = await cropFaceFromCanvas(canvasRef.current, landmarks);
        if (cropped) blob = cropped;
      }

      const data = await verifyFace(blob, checkpoint.id);
      setResult(data.data);
      setStage('verified');
      haptic('success');
    } catch (err) {
      const msg = err.message || 'Verification failed';
      if (err.code === 'WRONG_CHECKPOINT_ORDER') {
        setStage('wrong-order');
        setWrongOrderData(err.data);
        setErrorMsg(msg);
        haptic('error');
      } else if (msg.includes('No matching person') || msg.includes('UNKNOWN_FACE') || err.code === 'UNKNOWN_FACE') {
        setStage('rejected');
        setErrorMsg('Identity not recognized');
        haptic('error');
      } else {
        setStage('error');
        setErrorMsg(msg);
        haptic('error');
      }
    }
  };

  // Auto-restart after 5s when showing result
  useEffect(() => {
    if (stage !== 'verified' && stage !== 'rejected' && stage !== 'wrong-order' && stage !== 'error') return;
    const timer = setTimeout(() => {
      setStage('idle');
      setResult(null);
      setErrorMsg('');
      setWrongOrderData(null);
      setSnapshotUrl(null);
      if (!streamRef.current) startCamera();
    }, 5000);
    return () => clearTimeout(timer);
  }, [stage, startCamera]);

  // Reticle color based on detection state
  const reticleColor = () => {
    if (stage === 'verified') return 'border-emerald-500/80';
    if (stage === 'rejected' || stage === 'error') return 'border-red-500/80';
    if (stage === 'wrong-order') return 'border-amber-500/80';
    if (stage === 'scanning') return 'border-cyan-400/80';
    if (!faceDetected) return 'border-gray-400/40';
    if (!isCentered || currentPose !== 'front') return 'border-amber-400/60';
    if (isCentered && isStable && currentPose === 'front') return 'border-emerald-400/80';
    return 'border-cyan-400/60';
  };

  const stageColor = {
    idle: 'cyan',
    ready: 'cyan',
    scanning: 'cyan',
    verified: 'emerald',
    rejected: 'red',
    'wrong-order': 'amber',
    error: 'red',
  }[stage];

  const modelLoading = cameraReady && !isModelLoaded;

  // Status text shown on the webcam overlay
  const statusText = (() => {
    if (stage === 'idle' && !isModelLoaded) return 'Initializing...';
    if (stage === 'idle' && isModelLoaded && !faceDetected) return null; // handled by ScanFace overlay
    if (stage === 'ready' && currentPose !== 'front') return 'Look straight at the camera';
    if (stage === 'ready' && !isCentered) return 'Move closer and center your face';
    if (stage === 'ready' && !isStable) return 'Hold still...';
    if (stage === 'ready' && readyToCapture) return 'Hold still...';
    // Result stages have their own overlay — no bottom status text needed
    return null;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="p-6 py-12 flex flex-col items-center justify-center w-full max-w-2xl mx-auto h-full"
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="w-full max-w-sm mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Identity Check
          </h1>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${
            stage === 'verified'
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : stage === 'wrong-order'
              ? 'bg-amber-50 text-amber-600 border-amber-200'
              : stage === 'rejected' || stage === 'error'
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-sky-50 text-sky-600 border-sky-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              stage === 'scanning' ? 'animate-pulse' : ''
            } bg-${stageColor}-400`} />
            {stage === 'idle' && 'Waiting'}
            {stage === 'ready' && 'Detected'}
            {stage === 'scanning' && 'Scanning'}
            {stage === 'verified' && 'Cleared'}
            {stage === 'wrong-order' && 'Wrong Step'}
            {stage === 'rejected' && 'Denied'}
            {stage === 'error' && 'Error'}
          </div>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          {checkpoint.label}
        </p>
      </div>

      {/* Camera View */}
      <div className="relative w-full max-w-sm aspect-square rounded-xl overflow-hidden border border-input bg-muted">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-all duration-500 ${
            snapshotUrl ? 'blur-sm opacity-30' : stage === 'idle' && !faceDetected ? 'blur-sm brightness-75' : 'blur-0 brightness-100'
          }`}
        />

        {/* Frozen snapshot after capture */}
        {snapshotUrl && (
          <img
            src={snapshotUrl}
            alt="Captured"
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-[5]"
          />
        )}

        {/* Model loading overlay */}
        {modelLoading && stage === 'idle' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/30">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <span className="text-white text-xs font-medium mt-2">Initializing...</span>
          </div>
        )}

        {/* Idle attract overlay — only when no face and model loaded */}
        {stage === 'idle' && isModelLoaded && !faceDetected && !modelLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center"
            >
              <ScanFace className="w-12 h-12 text-white/70" strokeWidth={1.5} />
              <span className="text-white/80 text-sm font-medium mt-2 text-center px-4">
                Step up to verify your identity
              </span>
            </motion.div>
          </div>
        )}

        {/* Scanning: fade webcam and show verifying indicator */}
        <AnimatePresence>
          {stage === 'scanning' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-10 h-10 text-white/90" strokeWidth={1.5} />
              </motion.div>
              <span className="text-white/80 text-sm font-medium mt-3">Verifying identity...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Corner reticles */}
        <div className="absolute inset-3 pointer-events-none z-10">
          {[
            'top-0 left-0 border-t-2 border-l-2 rounded-tl',
            'top-0 right-0 border-t-2 border-r-2 rounded-tr',
            'bottom-0 left-0 border-b-2 border-l-2 rounded-bl',
            'bottom-0 right-0 border-b-2 border-r-2 rounded-br',
          ].map((pos, i) => (
            <div key={i} className={`absolute w-6 h-6 ${pos} ${reticleColor()} transition-colors duration-300`} />
          ))}
        </div>

        {/* Result overlay */}
        <AnimatePresence>
          {(stage === 'verified' || stage === 'rejected' || stage === 'wrong-order' || stage === 'error') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 ${
                stage === 'verified' ? 'bg-green-500/80' : stage === 'wrong-order' ? 'bg-amber-500/80' : 'bg-red-500/80'
              }`}
            >
              {stage === 'verified' ? (
                <ShieldCheck className="w-16 h-16 text-white" strokeWidth={1.5} />
              ) : stage === 'wrong-order' ? (
                <AlertTriangle className="w-16 h-16 text-white" strokeWidth={1.5} />
              ) : (
                <ShieldAlert className="w-16 h-16 text-white" strokeWidth={1.5} />
              )}
              <span className="text-sm font-bold text-white">
                {stage === 'verified' ? 'Identity Confirmed' : stage === 'wrong-order' ? 'Wrong Checkpoint' : stage === 'rejected' ? 'Access Denied' : 'Error'}
              </span>
              {stage === 'verified' && result && (
                <>
                  <span className="text-lg font-bold text-white mt-1">{result.name}</span>
                  {result.flightNumber && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Plane className="w-3.5 h-3.5 text-white/80" />
                      <span className="text-xs font-semibold text-white/90">
                        {result.flightNumber}
                        {result.gate && <> &middot; Gate {result.gate}</>}
                      </span>
                    </div>
                  )}
                  {NEXT_STEP[checkpoint.id] && (
                    <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-white/20">
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs font-semibold text-white">
                        {NEXT_STEP[checkpoint.id].useGate && result.gate
                          ? `Proceed to Gate ${result.gate}`
                          : NEXT_STEP[checkpoint.id].useFlight && result.flightNumber
                          ? `Board ${result.flightNumber}`
                          : NEXT_STEP[checkpoint.id].text}
                      </span>
                    </div>
                  )}
                </>
              )}
              {stage === 'wrong-order' && wrongOrderData && (
                <span className="text-xs text-white/80">{wrongOrderData.name} — complete previous step first</span>
              )}
              {(stage === 'rejected' || stage === 'error') && errorMsg && (
                <span className="text-xs text-white/80">{errorMsg}</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* On-webcam status text (bottom) */}
        <AnimatePresence>
          {statusText && stage !== 'scanning' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-0 left-0 right-0 z-15 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent"
            >
              <p className="text-white text-sm font-medium text-center">{statusText}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
