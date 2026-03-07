import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ScanFace, RotateCcw } from 'lucide-react';
import { verifyFace } from '../api';

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
  const [stage, setStage] = useState('ready'); // ready | scanning | verified | rejected | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

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

    try {
      const blob = await capturePhoto();
      if (!blob) throw new Error('Failed to capture photo');

      const data = await verifyFace(blob);

      setResult(data.data);
      setStage('verified');
    } catch (err) {
      const msg = err.message || 'Verification failed';
      if (msg.includes('No matching person') || msg.includes('UNKNOWN_FACE')) {
        setStage('rejected');
        setErrorMsg('Identity not recognized');
      } else {
        setStage('error');
        setErrorMsg(msg);
      }
    }
  };

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
    error: 'red',
  }[stage];

  return (
    <div className="flex flex-col h-full bg-[#020617] relative overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-slate-800 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-black text-white uppercase tracking-widest">
            Checkpoint Verify
          </h1>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${
            stage === 'verified'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : stage === 'rejected' || stage === 'error'
              ? 'bg-red-500/10 text-red-400 border-red-500/30'
              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              stage === 'scanning' ? 'animate-pulse' : ''
            } bg-${stageColor}-400`} />
            {stage === 'ready' && 'Standby'}
            {stage === 'scanning' && 'Scanning'}
            {stage === 'verified' && 'Cleared'}
            {stage === 'rejected' && 'Denied'}
            {stage === 'error' && 'Error'}
          </div>
        </div>

        {/* Checkpoint Selector */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CHECKPOINTS.map((cp) => (
            <button
              key={cp.id}
              onClick={() => setCheckpoint(cp)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider border transition-all ${
                checkpoint.id === cp.id
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
            >
              {cp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Camera + Result Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 relative">

        {/* Camera View */}
        <div className="relative w-full aspect-square max-w-[300px] rounded-2xl overflow-hidden border-2 border-slate-800 bg-black">
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
              className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-transparent via-cyan-400/20 to-cyan-400/60 border-b-2 border-cyan-300 z-10 pointer-events-none"
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
            {(stage === 'verified' || stage === 'rejected') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 ${
                  stage === 'verified' ? 'bg-emerald-950/70' : 'bg-red-950/70'
                }`}
              >
                {stage === 'verified' ? (
                  <ShieldCheck className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]" strokeWidth={1.5} />
                ) : (
                  <ShieldAlert className="w-16 h-16 text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" strokeWidth={1.5} />
                )}
                <span className={`font-mono text-sm font-bold uppercase tracking-widest ${
                  stage === 'verified' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {stage === 'verified' ? 'Identity Confirmed' : 'Access Denied'}
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
              className="mt-5 w-full max-w-[300px] bg-slate-900/60 border border-emerald-500/20 rounded-xl p-4 space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Passenger</div>
                <div className="font-mono text-sm text-white font-bold tracking-wider uppercase">{result.name}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Confidence</div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]"
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-emerald-400 font-bold">{result.confidence?.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Checkpoint</div>
                <div className="font-mono text-xs text-cyan-400 tracking-wider">{checkpoint.label}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Timestamp</div>
                <div className="font-mono text-xs text-slate-400 tracking-wider">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </motion.div>
          )}

          {(stage === 'rejected' || stage === 'error') && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-5 w-full max-w-[300px] bg-slate-900/60 border border-red-500/20 rounded-xl p-4 text-center"
            >
              <p className="font-mono text-xs text-red-400">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="px-5 pb-6 pt-4 z-10">
        {stage === 'ready' && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleScan}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-cyan-500 text-[#020617] font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-shadow"
          >
            <ScanFace className="w-5 h-5" />
            <span>Scan & Verify</span>
          </motion.button>
        )}

        {stage === 'scanning' && (
          <div className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-slate-800 text-cyan-400 font-mono text-sm uppercase tracking-widest">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RotateCcw className="w-4 h-4" />
            </motion.div>
            Verifying...
          </div>
        )}

        {(stage === 'verified' || stage === 'rejected' || stage === 'error') && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold tracking-widest uppercase hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Scan Next</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
