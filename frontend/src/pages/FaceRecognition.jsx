import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { enrollFace } from '../api';
import { Button } from '@/components/ui/button';

export default function FaceRecognition() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state?.userData || { fullName: 'Unknown' };

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
        // Give camera a moment to warm up, then start scan
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
        // Capture photo and enroll
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

  const circumference = 2 * Math.PI * 150;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center h-full bg-background px-6 py-12 sm:bg-card sm:border sm:border-border sm:rounded-2xl sm:shadow-sm sm:max-w-lg sm:mx-auto sm:my-12 sm:h-auto sm:py-12"
    >
      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full text-center mb-8">
        <h2 className="text-xl font-bold text-foreground">
          Create Your Biometric Pass
        </h2>
        <div className="mt-4 h-6 flex justify-center items-center">
           <p className={`text-sm font-medium transition-colors duration-300 ${statusConfig[scanStage].color}`}>
             {statusConfig[scanStage].text}
           </p>
        </div>
      </div>

      {/* The Hero Camera View */}
      <div className="relative w-[340px] h-[340px] flex items-center justify-center">

        {/* Glow Effects */}
        <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 transition-colors duration-1000 ${
          scanStage === 'complete' ? 'bg-emerald-500' : scanStage === 'error' ? 'bg-red-500' : scanStage === 'duplicate' ? 'bg-amber-500' : 'bg-primary'
        }`}></div>

        {/* Outer Progress Ring SVG */}
        <svg className="absolute w-[360px] h-[360px] -rotate-90 z-20 pointer-events-none border-transparent" viewBox="0 0 360 360">
          <circle
            cx="180" cy="180" r="150"
            stroke="rgba(30, 41, 59, 0.5)" strokeWidth="6" fill="none"
          />
          <circle
            cx="180" cy="180" r="150"
            stroke={scanStage === 'complete' ? '#22c55e' : scanStage === 'error' ? '#f87171' : scanStage === 'duplicate' ? '#f59e0b' : '#FACD2C'}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 0.1s ease-out'
            }}
            className="drop-shadow-[0_0_8px_rgba(250,205,44,0.5)]"
          />
        </svg>

        {/* The Camera Slot Wrapper */}
        <div className="relative w-80 h-80 rounded-full overflow-hidden border-2 border-slate-200 bg-background shadow-inner z-10 flex items-center justify-center">

          {/* Real camera stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />

          {/* Animated Scanning Line */}
          {scanStage !== 'idle' && scanStage !== 'complete' && scanStage !== 'error' && scanStage !== 'duplicate' && (
            <motion.div
              animate={{ y: ["-100%", "300%", "-100%"] }}
              transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
              className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-transparent via-primary/20 to-primary/50 border-b-[3px] border-primary z-30 pointer-events-none"
            />
          )}

          {/* Reticle grid overlay */}
          <div className="absolute inset-0 pointer-events-none z-20"></div>

          {/* Center alignment pip */}
          {scanStage !== 'complete' && scanStage !== 'error' && <div className="absolute w-2 h-2 rounded-full bg-primary/50 z-20 pointer-events-none"></div>}
        </div>
      </div>

      <div className="w-full px-8 text-center mt-8">
        {scanStage === 'duplicate' ? (
          <div className="space-y-2">
            <p className="text-sm text-amber-500 font-medium">{errorMsg}</p>
            <p className="text-xs text-muted-foreground">Redirecting to your boarding pass...</p>
          </div>
        ) : scanStage === 'error' ? (
          <div className="space-y-3">
            <p className="text-sm text-red-500">{errorMsg}</p>
            <Button
              variant="link"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Hold still and look at the camera
          </p>
        )}
      </div>
    </motion.div>
  );
}
