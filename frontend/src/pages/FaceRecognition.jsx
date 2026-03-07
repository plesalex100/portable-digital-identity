import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { enrollFace } from '../api';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Camera, Plane } from 'lucide-react';
import { getSession } from '@/lib/session';

export default function FaceRecognition() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state?.userData || getSession();

  useEffect(() => {
    if (!userData) navigate('/', { replace: true });
  }, []);

  if (!userData) return null;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Stages: 'idle' -> 'detecting' -> 'analyzing' -> 'hashing' -> 'complete' -> 'error'
  const [scanStage, setScanStage] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const statusConfig = {
    idle: { text: 'Starting camera...', color: 'text-muted-foreground' },
    detecting: { text: 'Looking for your face...', color: 'text-primary' },
    analyzing: { text: 'Capturing biometric data...', color: 'text-primary' },
    hashing: { text: 'Processing...', color: 'text-primary' },
    complete: { text: 'Biometric pass created!', color: 'text-emerald-600' },
    error: { text: 'Enrollment failed', color: 'text-red-500' },
    duplicate: { text: 'Already checked in', color: 'text-amber-500' },
  };

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
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
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
        setTimeout(() => {
          if (!cancelled) setScanStage('detecting');
        }, 1500);
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

  // Run scan stages and enroll
  useEffect(() => {
    let interval;

    if (scanStage === 'detecting' || scanStage === 'analyzing' || scanStage === 'hashing') {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) return 100;
          return p + 2;
        });
      }, 50);

      if (progress > 30 && scanStage === 'detecting') setScanStage('analyzing');

      if (progress >= 60 && scanStage === 'analyzing') {
        setScanStage('hashing');
        (async () => {
          try {
            const blob = await capturePhoto();
            if (!blob) throw new Error('Failed to capture photo');
            await enrollFace(userData, blob);
            setProgress(100);
            setScanStage('complete');
            stopCamera();
            setTimeout(() => {
              navigate('/pass', { state: { userData } });
            }, 1000);
          } catch (err) {
            console.error('Enrollment failed:', err);
            if (err.code === 'ALREADY_CHECKED_IN') {
              setErrorMsg(err.message || 'This passenger is already checked in');
              setScanStage('duplicate');
              stopCamera();
              setTimeout(() => {
                navigate('/pass', { state: { userData } });
              }, 2000);
              return;
            }
            setErrorMsg(err.message || 'Enrollment failed');
            setScanStage('error');
            stopCamera();
          }
        })();
      }
    }

    return () => clearInterval(interval);
  }, [scanStage, progress, navigate, userData, capturePhoto, stopCamera]);

  const circumference = 2 * Math.PI * 145;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const ringColor = scanStage === 'complete' ? '#22c55e' : scanStage === 'error' ? '#f87171' : scanStage === 'duplicate' ? '#f59e0b' : '#FACD2C';
  const glowColor = scanStage === 'complete' ? 'shadow-emerald-500/30' : scanStage === 'error' ? 'shadow-red-500/30' : scanStage === 'duplicate' ? 'shadow-amber-500/30' : 'shadow-primary/20';

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

        {/* Status text */}
        <div className="mt-2 h-6 flex justify-center items-center">
          <p className={`text-sm font-medium transition-colors duration-300 ${statusConfig[scanStage].color}`}>
            {statusConfig[scanStage].text}
          </p>
        </div>

        {/* Flight info mini strip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3 mt-4 mb-6 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border/40 shadow-sm"
        >
          <span className="text-xs font-bold text-foreground">{userData.departure || 'AMS'}</span>
          <Plane className="w-3 h-3 text-primary rotate-45" />
          <span className="text-xs font-bold text-foreground">{userData.arrival || 'FRA'}</span>
          <div className="w-px h-3 bg-border" />
          <span className="text-xs text-muted-foreground">{userData.flightNumber || 'SG372'}</span>
        </motion.div>

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
                transition: 'stroke-dashoffset 0.1s ease-out',
                filter: `drop-shadow(0 0 6px ${ringColor}40)`,
              }}
            />
          </svg>

          {/* Camera circle */}
          <div className={`relative w-[280px] h-[280px] rounded-full overflow-hidden border-2 border-white bg-slate-100 z-10 flex items-center justify-center shadow-xl ${glowColor}`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />

            {/* Scanning line */}
            {scanStage !== 'idle' && scanStage !== 'complete' && scanStage !== 'error' && scanStage !== 'duplicate' && (
              <motion.div
                animate={{ y: ["-100%", "300%", "-100%"] }}
                transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
                className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-transparent via-primary/15 to-primary/40 border-b-2 border-primary/70 z-30 pointer-events-none"
              />
            )}

            {/* Center pip */}
            {scanStage !== 'complete' && scanStage !== 'error' && (
              <div className="absolute w-2 h-2 rounded-full bg-primary/40 z-20 pointer-events-none" />
            )}

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

            {/* Success/error overlay */}
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

        {/* Passenger name tag */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Passenger</div>
          <div className="text-sm font-bold text-foreground">{userData.fullName}</div>
        </motion.div>

        {/* Progress bar (linear, below camera) */}
        <div className="w-48 mt-4">
          <div className="h-1 bg-border/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: ringColor, width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground text-center mt-1.5">{Math.round(progress)}%</div>
        </div>

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
          ) : (
            <p className="text-xs text-muted-foreground">
              Hold still and look at the camera
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
