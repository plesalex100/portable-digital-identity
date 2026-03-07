import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { saveBiometricData } from '../api';

export default function FaceRecognition() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state?.userData || { fullName: 'Unknown' };

  // Stages: 'idle' -> 'detecting' -> 'analyzing' -> 'hashing' -> 'complete'
  const [scanStage, setScanStage] = useState('idle');
  const [progress, setProgress] = useState(0);

  // Status mapping for the text UI
  const statusConfig = {
    idle: { text: 'ALIGN FACE WITHIN FRAME', color: 'text-cyan-500' },
    detecting: { text: '> DETECTING FACE...', color: 'text-cyan-400' },
    analyzing: { text: '> ANALYZING LANDMARKS...', color: 'text-cyan-300' },
    hashing: { text: '> GENERATING ENCRYPTED HASH...', color: 'text-cyan-200' },
    complete: { text: '✓ BIOMETRIC LOCK SECURED', color: 'text-emerald-400' },
  };

  useEffect(() => {
    let interval;
    if (scanStage === 'idle') {
      // Auto-start demonstration after 1 second
      setTimeout(() => setScanStage('detecting'), 1000);
    } else if (scanStage !== 'complete') {
      // Simulate progress ring
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) return 100;
          return p + 2;
        });
      }, 50);

      // Transition stages based on progress
      if (progress > 30 && scanStage === 'detecting') setScanStage('analyzing');
      if (progress > 60 && scanStage === 'analyzing') setScanStage('hashing');
      
      if (progress >= 100 && scanStage === 'hashing') {
        setProgress(100);
        setScanStage('complete');
        // Simulate API saving
        saveBiometricData(userData).then(() => {
          setTimeout(() => {
             navigate('/pass', { state: { userData } });
          }, 1000);
        });
      }
    }
    return () => clearInterval(interval);
  }, [scanStage, progress, navigate, userData]);

  const circumference = 2 * Math.PI * 120; // radius = 120
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center h-full bg-[#020617] px-6"
    >
      <div className="absolute top-12 w-full text-center">
        <h2 className="text-xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
          Zero-Trust Enrollment
        </h2>
        <div className="mt-4 h-6 flex justify-center items-center">
           <p className={`font-mono text-xs tracking-wider font-bold transition-colors duration-300 ${statusConfig[scanStage].color}`}>
             {statusConfig[scanStage].text}
           </p>
        </div>
      </div>

      {/* The Hero Camera View */}
      <div className="relative mt-16 w-[280px] h-[280px] flex items-center justify-center">
        
        {/* Glow Effects */}
        <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 transition-colors duration-1000 ${
          scanStage === 'complete' ? 'bg-emerald-500' : 'bg-cyan-500'
        }`}></div>

        {/* Outer Progress Ring SVG */}
        <svg className="absolute w-[300px] h-[300px] -rotate-90 z-20 pointer-events-none border-transparent">
          {/* Track */}
          <circle 
            cx="150" cy="150" r="120" 
            stroke="rgba(30, 41, 59, 0.5)" strokeWidth="6" fill="none"
          />
          {/* Progress Indicator */}
          <circle 
            cx="150" cy="150" r="120" 
            stroke={scanStage === 'complete' ? '#34d399' : '#22d3ee'} 
            strokeWidth="6" 
            fill="none" 
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 0.1s ease-out'
            }}
            className="drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]"
          />
        </svg>

        {/* The Camera Slot Wrapper */}
        <div className="relative w-64 h-64 rounded-full overflow-hidden border-2 border-slate-800 bg-[#020617] shadow-inner z-10 flex items-center justify-center">
          
          {/* 
            ===================================================================
            // TEAM: Inject real camera stream here 
            ===================================================================
          */}
          <div id="camera-slot" className="absolute inset-0 w-full h-full bg-slate-900/60 flex items-center justify-center">
             <span className="text-slate-600 font-mono text-[10px] uppercase tracking-widest bg-black/50 px-2 py-1 rounded">
               [ Camera Stream Hook ]
             </span>
          </div>

          {/* Animated Scanning Line */}
          {scanStage !== 'idle' && scanStage !== 'complete' && (
            <motion.div
              animate={{ y: ["-100%", "300%", "-100%"] }}
              transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
              className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-transparent via-cyan-400/20 to-cyan-400/70 border-b-[3px] border-cyan-300 z-30 pointer-events-none shadow-[0_5px_15px_rgba(34,211,238,0.5)]"
            />
          )}

          {/* Reticle grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-20"></div>
          
          {/* Center alignment pip */}
          {scanStage !== 'complete' && <div className="absolute w-2 h-2 rounded-full bg-cyan-500/50 shadow-[0_0_8px_rgba(34,211,238,0.8)] z-20 pointer-events-none"></div>}
        </div>
      </div>

      <div className="absolute bottom-12 w-full px-8 text-center">
         <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 flex justify-center gap-1">
           System Load: <span className="text-cyan-400">{Math.floor(Math.random() * 20 + 40)}%</span> | Latency: <span className="text-cyan-400">14ms</span>
         </div>
      </div>
    </motion.div>
  );
}
