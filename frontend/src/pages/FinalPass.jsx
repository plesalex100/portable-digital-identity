import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, Fingerprint, Plane } from 'lucide-react';

export default function FinalPass() {
  const location = useLocation();
  const userData = location.state?.userData || { fullName: 'JOHN DOE', nationality: 'USA', passportNumber: 'SECURE-X1' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col h-full w-full relative overflow-hidden"
    >
      {/* Cloud background */}
      <div className="absolute inset-0 z-0">
        <img src="/bg-image.jpg" alt="" className="w-full h-full object-cover opacity-25 animate-drift" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/90 to-white" />
      </div>

      <div className="relative z-10 flex flex-col items-center p-6 pt-10 flex-1 overflow-y-auto">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="w-16 h-16 aspect-square shrink-0 rounded-full bg-emerald-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30"
        >
          <CheckCircle2 className="w-8 h-8 text-white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display text-2xl font-semibold text-foreground"
        >
          Your Boarding Pass
        </motion.h1>
        <p className="text-muted-foreground text-sm mt-1">You're all set for your flight!</p>

        {/* Boarding Pass Ticket */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full mt-6"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-border/50 overflow-hidden">
            {/* Ticket header */}
            <div className="bg-white border-b border-border/40 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="SkyGate" className="w-8 h-8" />
                <div>
                  <div className="text-foreground text-xs font-bold tracking-wider uppercase">SkyGate Airways</div>
                  <div className="text-muted-foreground text-[10px]">Boarding Pass</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-foreground text-xs font-bold">{userData.flightNumber || 'SG372'}</div>
                <div className="text-muted-foreground text-[10px]">Economy</div>
              </div>
            </div>

            {/* Route display */}
            <div className="px-5 py-5 flex items-center justify-between">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground tracking-wide">{userData.departure || 'AMS'}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Amsterdam</div>
              </div>
              <div className="flex-1 flex items-center justify-center px-4">
                <div className="h-px flex-1 bg-border" />
                <div className="mx-3 bg-primary/10 p-2 rounded-full">
                  <Plane className="w-4 h-4 text-primary rotate-45" />
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground tracking-wide">{userData.arrival || 'FRA'}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Frankfurt</div>
              </div>
            </div>

            {/* Dashed separator with notches */}
            <div className="relative px-5">
              <div className="border-t-2 border-dashed border-border/60" />
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background" />
            </div>

            {/* Passenger details */}
            <div className="px-5 py-4 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Passenger</div>
                <div className="text-sm font-bold text-foreground mt-0.5 truncate">{userData.fullName}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Gate</div>
                <div className="text-sm font-bold text-foreground mt-0.5">{userData.gate || 'A7'}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Passport</div>
                <div className="text-sm font-medium text-foreground mt-0.5">***{userData.passportNumber?.slice(-4) || '1234'}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Nationality</div>
                <div className="text-sm font-medium text-foreground mt-0.5">{userData.nationality}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Biometric active strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="w-full mt-5 bg-emerald-50 rounded-xl p-3 flex items-center justify-center border border-emerald-200"
        >
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span className="text-emerald-700 text-sm font-medium">Biometric Pass Active</span>
          </div>
        </motion.div>

        {/* At the airport instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="w-full mt-6"
        >
          <h2 className="text-sm font-semibold text-foreground mb-3">At the airport</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Fingerprint className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Go to immigration</p>
                <p className="text-xs text-muted-foreground">Look at the biometric camera — no passport needed, your face is your ID.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Plane className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Board your flight</p>
                <p className="text-xs text-muted-foreground">Head to Gate {userData.gate || 'A7'} — scan your face at the gate to board.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
