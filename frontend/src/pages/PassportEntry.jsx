import { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ScanFace, ShieldCheck, UserRound, BookOpen, Globe, CalendarIcon, Loader2, Plane, ArrowRight, Ticket } from 'lucide-react';
import { format } from 'date-fns';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { checkPassenger } from '@/api';

const generatePassportNumber = () => {
  const digits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
  return `R${digits}`;
};

const SHARED_FLIGHT = {
  flightNumber: 'SG372',
  airline: 'SkyGate Airways',
  departure: 'AMS',
  arrival: 'FRA',
  gate: 'A7',
};

export default function PassportEntry() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    passportNumber: generatePassportNumber(),
    nationality: 'Romania',
    expiryDate: new Date('2029-08-15'),
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'passportNumber') setAlreadyCheckedIn(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.passportNumber) return;

    setChecking(true);
    setAlreadyCheckedIn(false);
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const result = await checkPassenger(formData.passportNumber);
      if (result.exists) {
        setAlreadyCheckedIn(true);
        return;
      }
      setShowSuccessModal(true);
    } catch {
      setShowSuccessModal(true);
    } finally {
      setChecking(false);
    }
  };

  const mergedUserData = { ...formData, ...SHARED_FLIGHT, expiryDate: formData.expiryDate ? format(formData.expiryDate, 'yyyy-MM-dd') : '' };

  const isFormValid = formData.fullName && formData.passportNumber && formData.nationality && formData.expiryDate;

  if (showSuccessModal) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col h-full w-full relative overflow-hidden"
      >
        {/* Cloud background */}
        <div className="absolute inset-0 z-0">
          <img src="/bg-image.jpg" alt="" className="w-full h-full object-cover opacity-30 animate-drift" />
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
            You're checked in!
          </motion.h1>
          <p className="text-muted-foreground text-sm mt-1">Flight {SHARED_FLIGHT.flightNumber}</p>

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
                  <div className="text-foreground text-xs font-bold">{SHARED_FLIGHT.flightNumber}</div>
                  <div className="text-muted-foreground text-[10px]">Economy</div>
                </div>
              </div>

              {/* Route display */}
              <div className="px-5 py-5 flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground tracking-wide">{SHARED_FLIGHT.departure}</div>
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
                  <div className="text-2xl font-bold text-foreground tracking-wide">{SHARED_FLIGHT.arrival}</div>
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
                  <div className="text-sm font-bold text-foreground mt-0.5 truncate">{formData.fullName}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Gate</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">{SHARED_FLIGHT.gate}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Passport</div>
                  <div className="text-sm font-medium text-foreground mt-0.5">***{formData.passportNumber?.slice(-4)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Nationality</div>
                  <div className="text-sm font-medium text-foreground mt-0.5">{formData.nationality}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-3 mt-6 w-full"
          >
            <p className="text-sm text-muted-foreground text-center">
              Skip the queues with biometric boarding
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate('/face-scan', { state: { userData: mergedUserData } })}
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col h-full w-full relative overflow-hidden"
    >
      {/* Hero header with airplane image */}
      <div className="relative w-full h-52 shrink-0 overflow-hidden">
        <img
          src="/airplane-5.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-background" />

        {/* Logo + header text overlay */}
        <div className="absolute inset-0 flex flex-col items-start justify-end px-6 pb-8">
          <motion.img
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            src="/logo.svg"
            alt="SkyGate"
            className="w-12 h-12 drop-shadow-lg"
          />
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display text-2xl font-semibold text-white mt-2 drop-shadow-md"
          >
            Online Check-in
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/70 text-xs mt-1"
          >
            Enter your details to board
          </motion.p>
        </div>
      </div>

      {/* Flight route strip */}
      <div className="relative z-10 -mt-5 mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-xl shadow-md border border-border/40 px-5 py-3.5 flex items-center justify-between"
        >
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{SHARED_FLIGHT.departure}</div>
            <div className="text-[10px] text-muted-foreground">Amsterdam</div>
          </div>
          <div className="flex-1 flex items-center justify-center px-3">
            <div className="h-px flex-1 border-t border-dashed border-border" />
            <div className="mx-2 bg-primary/10 p-1.5 rounded-full">
              <Plane className="w-3.5 h-3.5 text-primary rotate-45" />
            </div>
            <div className="h-px flex-1 border-t border-dashed border-border" />
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{SHARED_FLIGHT.arrival}</div>
            <div className="text-[10px] text-muted-foreground">Frankfurt</div>
          </div>
          <div className="ml-4 pl-4 border-l border-border">
            <div className="text-[10px] text-muted-foreground">Flight</div>
            <div className="text-sm font-bold text-primary">{SHARED_FLIGHT.flightNumber}</div>
          </div>
        </motion.div>
      </div>

      {/* Form area */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Legal Name</Label>
            <div className="relative">
              <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="JOHN DOE"
                required
                className="pl-11 h-12 rounded-xl bg-white border-border/60 shadow-sm focus:shadow-md transition-shadow"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Passport Number</Label>
            <div className="relative">
              <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                value={formData.passportNumber}
                readOnly
                className="pl-11 h-12 rounded-xl bg-muted/50 border-border/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nationality</Label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  value={formData.nationality}
                  readOnly
                  className="pl-11 h-12 rounded-xl bg-muted/50 border-border/40"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expiry Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  value={format(formData.expiryDate, "MMM yyyy")}
                  readOnly
                  className="pl-11 h-12 rounded-xl bg-muted/50 border-border/40"
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {alreadyCheckedIn && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center"
              >
                This passport is already checked in.
              </motion.p>
            )}
          </AnimatePresence>

          <div className="pt-2 pb-4">
            <Button
              type="submit"
              disabled={!isFormValid || checking}
              variant={isFormValid ? "default" : "secondary"}
              size="lg"
              className="w-full h-13 rounded-xl shadow-md shadow-primary/20 group"
              asChild
            >
              <motion.button whileTap={{ scale: 0.97 }} className="w-full justify-between relative overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  {checking ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.3, ease: "easeOut", delay: 0.15 }}
                      className="inline-flex items-center gap-2"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="font-semibold">Checking...</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, transition: { duration: 0.25, ease: "easeIn" } }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="inline-flex items-center gap-2"
                    >
                      <span className="font-semibold">Check In</span>
                    </motion.span>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {!checking && (
                    <motion.span
                      key="arrow"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30, transition: { duration: 0.2, ease: "easeIn" } }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </Button>
          </div>
        </motion.form>
      </div>
    </motion.div>
  );
}
