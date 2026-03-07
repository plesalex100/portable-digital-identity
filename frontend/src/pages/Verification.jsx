import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ScanFace, RotateCcw, AlertTriangle } from 'lucide-react';
import { verifyFace } from '../api';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const CHECKPOINTS = [
  { id: 'security', label: 'Security Checkpoint' },
  { id: 'immigration', label: 'Immigration Control' },
  { id: 'boarding', label: 'Boarding Gate' },
  { id: 'lounge', label: 'Lounge Access' },
];

export default function Verification() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [checkpoint, setCheckpoint] = useState(CHECKPOINTS[0]);
  const [stage, setStage] = useState('ready'); // ready | scanning | verified | rejected | wrong-order | error
  const [cameraReady, setCameraReady] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [wrongOrderData, setWrongOrderData] = useState(null);

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
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);


  const handleScan = async () => {
    setStage('scanning');
    setResult(null);
    setErrorMsg('');
    setWrongOrderData(null);

    try {
      const blob = await capturePhoto();
      if (!blob) throw new Error('Failed to capture photo');

      const data = await verifyFace(blob, checkpoint.id);

      setResult(data.data);
      setStage('verified');
    } catch (err) {
      const msg = err.message || 'Verification failed';
      if (err.code === 'WRONG_CHECKPOINT_ORDER') {
        setStage('wrong-order');
        setWrongOrderData(err.data);
        setErrorMsg(msg);
      } else if (msg.includes('No matching person') || msg.includes('UNKNOWN_FACE') || err.code === 'UNKNOWN_FACE') {
        setStage('rejected');
        setErrorMsg('Identity not recognized');
      } else {
        setStage('error');
        setErrorMsg(msg);
      }
    }
  };

  // Auto-scan when camera is ready or after reset
  useEffect(() => {
    if (stage !== 'ready' || !cameraReady) return;
    const timer = setTimeout(() => handleScan(), 1500);
    return () => clearTimeout(timer);
  }, [stage, cameraReady]);

  // Auto-restart after 5s when verified, rejected, or wrong-order
  useEffect(() => {
    if (stage !== 'verified' && stage !== 'rejected' && stage !== 'wrong-order') return;
    const timer = setTimeout(() => handleReset(), 5000);
    return () => clearTimeout(timer);
  }, [stage]);

  const handleReset = () => {
    setStage('ready');
    setResult(null);
    setErrorMsg('');
    if (!streamRef.current) startCamera();
  };

  const stageColor = {
    ready: 'cyan',
    scanning: 'cyan',
    verified: 'emerald',
    rejected: 'red',
    'wrong-order': 'amber',
    error: 'red',
  }[stage];

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-slate-200 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-foreground">
            Identity Check
          </h1>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${
            stage === 'verified'
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : stage === 'wrong-order'
              ? 'bg-amber-50 text-amber-600 border-amber-200'
              : stage === 'rejected' || stage === 'error'
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-sky-50 text-primary border-sky-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              stage === 'scanning' ? 'animate-pulse' : ''
            } bg-${stageColor}-400`} />
            {stage === 'ready' && 'Standby'}
            {stage === 'scanning' && 'Scanning'}
            {stage === 'verified' && 'Cleared'}
            {stage === 'wrong-order' && 'Wrong Step'}
            {stage === 'rejected' && 'Denied'}
            {stage === 'error' && 'Error'}
          </div>
        </div>

        {/* Checkpoint Selector */}
        <Select value={checkpoint.id} onValueChange={(val) => setCheckpoint(CHECKPOINTS.find(cp => cp.id === val))}>
          <SelectTrigger className="w-full rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHECKPOINTS.map((cp) => (
              <SelectItem key={cp.id} value={cp.id}>{cp.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Camera + Result Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 relative">

        {/* Camera View */}
        <div className="relative w-full aspect-square max-w-[300px] rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />

          {/* Scan overlay */}
          {stage === 'scanning' && (
            <motion.div
              animate={{ y: ['-100%', '300%', '-100%'] }}
              transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
              className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-transparent via-primary/20 to-primary/50 border-b-2 border-primary z-10 pointer-events-none"
            />
          )}

          {/* Corner reticles */}
          <div className="absolute inset-3 pointer-events-none z-10">
            <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-tl border-${stageColor}-500/60`} />
            <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr border-${stageColor}-500/60`} />
            <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl border-${stageColor}-500/60`} />
            <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-br border-${stageColor}-500/60`} />
          </div>

          {/* Result overlay */}
          <AnimatePresence>
            {(stage === 'verified' || stage === 'rejected' || stage === 'wrong-order') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 ${
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
                  {stage === 'verified' ? 'Identity Confirmed' : stage === 'wrong-order' ? 'Wrong Checkpoint' : 'Access Denied'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Result Details */}
        <AnimatePresence mode="wait">
          {stage === 'verified' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-5 w-full max-w-[300px] bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">Passenger</div>
                <div className="text-sm text-foreground font-medium">{result.name}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">Confidence</div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs text-emerald-600 font-bold">{result.confidence?.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">Checkpoint</div>
                <div className="text-xs text-primary font-medium">{checkpoint.label}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">Timestamp</div>
                <div className="text-xs text-muted-foreground">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </motion.div>
          )}

          {stage === 'wrong-order' && wrongOrderData && (
            <motion.div
              key="wrong-order"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-5 w-full max-w-[300px] bg-card border border-amber-200 rounded-xl p-4 space-y-3 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">Passenger</div>
                <div className="text-sm text-foreground font-medium">{wrongOrderData.name}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">Current Status</div>
                <div className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{wrongOrderData.currentStatusLabel}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">Confidence</div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${wrongOrderData.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs text-amber-600 font-bold">{wrongOrderData.confidence?.toFixed(1)}%</span>
                </div>
              </div>
              <p className="text-xs text-amber-600 text-center pt-1">
                Please complete the previous checkpoint first
              </p>
            </motion.div>
          )}

          {(stage === 'rejected' || stage === 'error') && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-5 w-full max-w-[300px] bg-card border border-red-200 rounded-xl p-4 text-center shadow-sm"
            >
              <p className="text-sm text-red-500">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status Text */}
      <div className="px-5 pb-6 pt-4 z-10 text-center text-sm text-muted-foreground">
        {stage === 'ready' && 'Preparing scan...'}
        {stage === 'scanning' && (
          <span className="flex items-center justify-center gap-2 text-primary font-medium">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <RotateCcw className="w-4 h-4" />
            </motion.div>
            Verifying...
          </span>
        )}
        {stage === 'verified' && 'Verified — next passenger in a moment...'}
        {stage === 'wrong-order' && 'Wrong checkpoint — retrying shortly...'}
        {stage === 'rejected' && 'Not recognized — retrying shortly...'}
        {stage === 'error' && 'Something went wrong — retrying...'}
      </div>
    </div>
  );
}
