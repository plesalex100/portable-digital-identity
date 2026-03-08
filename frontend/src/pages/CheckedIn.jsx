import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ScanFace, ShieldCheck, Plane, ArrowRight, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSession, saveSession } from '@/lib/session';

export default function CheckedIn() {
  const navigate = useNavigate();
  const userData = getSession();

  useEffect(() => {
    if (!userData) navigate('/', { replace: true });
  }, []);

  if (!userData) return null;

  const navigateWithSession = (path) => {
    saveSession(userData);
    navigate(path, { state: { userData } });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col min-h-screen w-full relative overflow-hidden"
    >
      {/* Cloud background */}
      <div className="absolute inset-0 z-0">
        <img src="/bg-image.jpg" alt="" className="w-full h-full object-cover opacity-30 animate-drift" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/90 to-white" />
      </div>

      <div className="relative z-10 flex flex-col items-center p-6 pt-10 flex-1 overflow-y-auto">
        {/* Success header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          className="flex items-center gap-4 w-full"
        >
          <div className="w-14 h-14 aspect-square shrink-0 rounded-full bg-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">You're checked in!</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Flight {userData.flightNumber || 'SG372'}</p>
          </div>
        </motion.div>

        {/* Boarding Pass Ticket */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
          className="w-full mt-6"
        >
          <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
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
                <div className="text-sm font-medium text-foreground mt-0.5">***{userData.passportNumber?.slice(-4)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Nationality</div>
                <div className="text-sm font-medium text-foreground mt-0.5">{userData.nationality}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
          className="flex flex-col gap-3 mt-6 w-full"
        >
          <p className="text-sm text-muted-foreground text-center">
            Skip the queues with biometric boarding
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => navigateWithSession('/face-scan')}
            asChild
          >
            <motion.button whileTap={{ scale: 0.96 }} className="text-sm">
              <ScanFace className="w-5 h-5 shrink-0" />
              <span>Create Biometric Pass</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </motion.button>
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted & secure — your data is never shared</span>
          </div>
          <Button
            variant="ghost"
            className="text-sm"
            onClick={() => {}}
          >
            <Ticket className="w-4 h-4 shrink-0" />
            Download Normal Boarding Ticket
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
