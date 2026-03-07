import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ScanFace, ShieldCheck, UserRound, BookOpen, Globe, CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Ticket } from 'lucide-react';
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
        className="p-6 flex flex-col h-full md:py-12 w-full md:max-w-2xl md:mx-auto"
      >
        <div className="flex-1 w-full mx-auto sm:bg-card sm:border sm:border-border sm:rounded-2xl sm:shadow-sm sm:p-6 sm:flex-initial flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground">You're checked in!</h1>
          <p className="text-muted-foreground text-sm mt-1">Here's your flight summary</p>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm w-full mt-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Passenger</span>
              <span className="font-medium">{formData.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Flight</span>
              <span className="font-medium">{SHARED_FLIGHT.flightNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Route</span>
              <span className="font-medium">{SHARED_FLIGHT.departure} → {SHARED_FLIGHT.arrival}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gate</span>
              <span className="font-medium">{SHARED_FLIGHT.gate}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-6 w-full">
            <p className="text-sm text-muted-foreground text-center">
              Skip the queues — a quick face scan lets you breeze through security and boarding in seconds.
            </p>
            <Button
              variant="accent"
              size="lg"
              className="w-full"
              onClick={() => navigate('/face-scan', { state: { userData: mergedUserData } })}
              asChild
            >
              <motion.button whileTap={{ scale: 0.96 }} className="text-sm">
                <ScanFace className="w-5 h-5 shrink-0" />
                <span>Create Biometric Pass</span>
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
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="p-6 flex flex-col h-full md:py-12 w-full md:max-w-2xl md:mx-auto"
    >
      <div className="flex-1 w-full mx-auto sm:bg-card sm:border sm:border-border sm:rounded-2xl sm:shadow-sm sm:p-6 sm:flex-initial">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Online Check-in
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enter your details to check in for your flight
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <Label>Full Legal Name</Label>
            <div className="relative">
              <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="JOHN DOE"
                required
                className="pl-11"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Passport Number</Label>
            <div className="relative">
              <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                value={formData.passportNumber}
                readOnly
                className="bg-muted pl-11"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nationality</Label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                value={formData.nationality}
                readOnly
                className="bg-muted pl-11"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Expiry Date</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                value={format(formData.expiryDate, "PPP")}
                readOnly
                className="bg-muted pl-11"
              />
            </div>
          </div>

          {alreadyCheckedIn && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
              This passport is already checked in.
            </p>
          )}

          <div className="pt-4 pb-4 sm:pb-0">
            <Button
              type="submit"
              disabled={!isFormValid || checking}
              variant={isFormValid ? "default" : "secondary"}
              size="lg"
              className="w-full py-4 group"
              asChild
            >
              <motion.button whileTap={{ scale: 0.96 }}>
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check In'
                )}
              </motion.button>
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
