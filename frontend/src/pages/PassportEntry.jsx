import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Network, Check, ChevronDown, CalendarIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const fetchCountries = async () => {
  const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flag,cca2,cca3');
  return response.json();
}

export default function PassportEntry() {
  const navigate = useNavigate();
  const { data: countries } = useQuery({ queryKey: ['countries'], queryFn: fetchCountries })

  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    passportNumber: '',
    nationality: '',
    expiryDate: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/face-scan', { state: { userData: { ...formData, expiryDate: formData.expiryDate ? format(formData.expiryDate, 'yyyy-MM-dd') : '' } } });
  };

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
      <div className="mt-8 mb-8 flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
          <div className="w-12 h-12 rounded-xl bg-secondary border border-primary/50 flex items-center justify-center relative shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <Network className="text-primary w-6 h-6 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <div className="absolute inset-0.5 border border-primary/20 rounded-lg"></div>
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-primary rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary rounded-br-lg"></div>
          </div>
        </div>

        <div>
          <h1 className="text-lg font-black text-foreground tracking-widest uppercase">
            Digital Identity
          </h1>
          <p className="text-primary/70 text-xs font-mono mt-0.5 tracking-wider">
            DOCUMENT ACQUISITION
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1 w-full max-w-sm mx-auto">
        <div className="space-y-1.5">
          <Label>Full Legal Name</Label>
          <Input
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="JOHN DOE"
            className="uppercase"
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
            className="uppercase"
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
                  "flex h-12 w-full items-center justify-between rounded-xl border border-input bg-secondary/50 px-4 py-3.5 font-mono text-sm shadow-inner transition-colors",
                  formData.nationality ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <span className="uppercase truncate">
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
                        <span className="font-mono text-sm truncate">{country.name.common}</span>
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
                  "flex h-12 w-full items-center rounded-xl border border-input bg-secondary/50 px-4 py-3.5 font-mono text-sm shadow-inner transition-colors",
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

        <div className="mt-auto pt-8 pb-4">
          <Button
            type="submit"
            disabled={!isFormValid}
            variant={isFormValid ? "default" : "secondary"}
            size="lg"
            className="w-full py-4 group"
            asChild
          >
            <motion.button whileTap={{ scale: 0.96 }}>
              {isFormValid && (
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              )}
              <span className="relative z-10">Verify & Continue</span>
            </motion.button>
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
