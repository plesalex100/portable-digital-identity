import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, CalendarIcon, UserRound, CheckCircle2, Plane, ScanFace, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const PRESET_USERS = [
  { fullName: 'Ples Alexandru-Nicusor', passportNumber: 'R14827365', nationality: 'Romania', expiryDate: new Date('2029-08-15') },
  { fullName: 'Raul Covaci', passportNumber: 'R27391048', nationality: 'Romania', expiryDate: new Date('2030-03-22') },
  { fullName: 'Stefan Eduard', passportNumber: 'R58203947', nationality: 'Romania', expiryDate: new Date('2028-11-07') },
  { fullName: 'Fanea Mihai', passportNumber: 'R63948172', nationality: 'Romania', expiryDate: new Date('2031-01-30') },
  { fullName: 'Madar Bogdan', passportNumber: 'R41750283', nationality: 'Romania', expiryDate: new Date('2029-06-18') },
];

const SHARED_FLIGHT = {
  flightNumber: 'SG372',
  airline: 'SkyGate Airways',
  departure: 'AMS',
  arrival: 'FRA',
  gate: 'A7',
};

const fetchCountries = async () => {
  const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flag,cca2,cca3');
  return response.json();
}

export default function PassportEntry() {
  const navigate = useNavigate();
  const { data: countries } = useQuery({ queryKey: ['countries'], queryFn: fetchCountries })

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    passportNumber: '',
    nationality: '',
    expiryDate: null
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleUserSelect = (user) => {
    setSelectedUser(user.fullName);
    setFormData({
      fullName: user.fullName,
      passportNumber: user.passportNumber,
      nationality: user.nationality,
      expiryDate: user.expiryDate,
    });
    setUserDropdownOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuccessModal(true);
  };

  const mergedUserData = { ...formData, ...SHARED_FLIGHT, expiryDate: formData.expiryDate ? format(formData.expiryDate, 'yyyy-MM-dd') : '' };

  const sortedCountries = countries?.slice().sort((a, b) => a.name.common.localeCompare(b.name.common));

  const isFormValid = formData.fullName && formData.passportNumber && formData.nationality && formData.expiryDate;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="p-6 flex flex-col h-full bg-background"
    >
      <div className="mt-6 mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Online Check-in
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your details to check in for your flight
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1 w-full max-w-sm mx-auto">
        <div className="space-y-1.5">
          <Label>Passenger</Label>
          <Popover open={userDropdownOpen} onOpenChange={setUserDropdownOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                role="combobox"
                aria-expanded={userDropdownOpen}
                className={cn(
                  "flex h-12 w-full items-center justify-between rounded-xl border border-input bg-white px-4 py-3.5 text-sm transition-colors",
                  selectedUser ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  <UserRound className="h-4 w-4 text-primary shrink-0" />
                  {selectedUser || "Select passenger"}
                </span>
                <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform", userDropdownOpen && "rotate-180")} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 overflow-hidden" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
              <Command className="w-full">
                <CommandList>
                  <CommandGroup>
                    {PRESET_USERS.map((user) => (
                      <CommandItem
                        key={user.fullName}
                        value={user.fullName}
                        onSelect={() => handleUserSelect(user)}
                      >
                        <UserRound className="h-4 w-4 text-primary mr-2 shrink-0" />
                        <span className="text-sm truncate">{user.fullName}</span>
                        {selectedUser === user.fullName && (
                          <Check className="ml-auto h-4 w-4 text-primary shrink-0" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label>Full Legal Name</Label>
          <Input
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="JOHN DOE"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>Passport Number</Label>
          <Input
            name="passportNumber"
            value={formData.passportNumber}
            onChange={handleChange}
            placeholder="A12345678"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>Nationality</Label>
          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                role="combobox"
                aria-expanded={comboboxOpen}
                className={cn(
                  "flex h-12 w-full items-center justify-between rounded-xl border border-input bg-white px-4 py-3.5 text-sm transition-colors",
                  formData.nationality ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <span className="truncate">
                  {formData.nationality
                    ? `${sortedCountries?.find(c => c.name.common === formData.nationality)?.flag || ''} ${formData.nationality}`
                    : "Select Country"}
                </span>
                <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform", comboboxOpen && "rotate-180")} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 overflow-hidden" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
              <Command className="w-full">
                <CommandInput placeholder="Search country..." />
                <CommandList>
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {sortedCountries?.map((country) => (
                      <CommandItem
                        key={country.name.common}
                        value={country.name.common}
                        onSelect={(value) => {
                          setFormData(prev => ({ ...prev, nationality: value }));
                          setComboboxOpen(false);
                        }}
                      >
                        <span className="text-xl">{country.flag}</span>
                        <span className="text-sm truncate">{country.name.common}</span>
                        {formData.nationality === country.name.common && (
                          <Check className="ml-auto h-4 w-4 text-primary shrink-0" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label>Expiry Date</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-12 w-full items-center rounded-xl border border-input bg-white px-4 py-3.5 text-sm transition-colors",
                  formData.expiryDate ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                {formData.expiryDate ? format(formData.expiryDate, "PPP") : "Select expiry date"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 overflow-hidden" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
              <Calendar
                mode="single"
                selected={formData.expiryDate}
                onSelect={(date) => {
                  setFormData(prev => ({ ...prev, expiryDate: date }));
                  setCalendarOpen(false);
                }}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="pt-6 pb-4">
          <Button
            type="submit"
            disabled={!isFormValid}
            variant={isFormValid ? "default" : "secondary"}
            size="lg"
            className="w-full py-4 group"
            asChild
          >
            <motion.button whileTap={{ scale: 0.96 }}>
              Check In
            </motion.button>
          </Button>
        </div>
      </form>
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm mx-auto rounded-2xl">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <DialogTitle className="text-xl font-bold">You're checked in!</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Here's your flight summary
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
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

          <div className="flex flex-col gap-3 mt-2">
            <p className="text-sm text-muted-foreground text-center">
              Skip the queues — a quick face scan lets you breeze through security and boarding in seconds.
            </p>
            <Button
              variant="accent"
              size="lg"
              className="w-full"
              onClick={() => { setShowSuccessModal(false); setTimeout(() => navigate('/face-scan', { state: { userData: mergedUserData } }), 300); }}
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
              onClick={() => { setShowSuccessModal(false); setTimeout(() => navigate('/pass', { state: { userData: mergedUserData } }), 300); }}
            >
              Skip for now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
