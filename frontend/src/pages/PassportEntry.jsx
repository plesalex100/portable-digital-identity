import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Network, ChevronDown, Search, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const fetchCountries = async () => {
  const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flag,cca2,cca3');
  return response.json();
}

export default function PassportEntry() {
  const navigate = useNavigate();
  const { data: countries } = useQuery({ queryKey: ['countries'], queryFn: fetchCountries })

  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const comboboxRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
        setComboboxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLower = countrySearch.toLowerCase();
  const filteredCountries = countries?.filter(country => 
    country.name.common.toLowerCase().includes(searchLower) ||
    country.cca2?.toLowerCase().includes(searchLower) ||
    country.cca3?.toLowerCase().includes(searchLower)
  ).sort((a, b) => {
    const aStarts = a.name.common.toLowerCase().startsWith(searchLower);
    const bStarts = b.name.common.toLowerCase().startsWith(searchLower);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.name.common.localeCompare(b.name.common);
  });

  const [formData, setFormData] = useState({
    fullName: '',
    passportNumber: '',
    nationality: '',
    expiryDate: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you might save formData to context/state here
    navigate('/face-scan', { state: { userData: formData } });
  };

  const isFormValid = formData.fullName && formData.passportNumber && formData.nationality && formData.expiryDate;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="p-6 flex flex-col h-full bg-[#020617]"
    >
      <div className="mt-8 mb-10 flex flex-col items-center">
        {/* Decorative Scan Chip Icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse"></div>
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-cyan-500/50 flex items-center justify-center relative shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <Network className="text-cyan-400 w-10 h-10 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />

            {/* Corner brackets */}
            <div className="absolute inset-1 border border-cyan-500/20 rounded-xl"></div>
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 rounded-br-xl"></div>
          </div>
        </div>

        <h1 className="text-2xl font-black text-white tracking-widest uppercase">
          Digital Identity
        </h1>
        <p className="text-cyan-500/70 text-sm font-mono mt-2 tracking-wider">
          DOCUMENT ACQUISITION
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1 w-full max-w-sm mx-auto">
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="JOHN DOE"
            className="w-full bg-slate-900/50 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3.5 outline-none text-white font-mono placeholder:text-slate-600 transition-colors shadow-inner"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest ml-1">Passport Number</label>
          <input
            type="text"
            name="passportNumber"
            value={formData.passportNumber}
            onChange={handleChange}
            placeholder="A12345678"
            className="w-full bg-slate-900/50 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3.5 outline-none text-white font-mono placeholder:text-slate-600 transition-colors uppercase shadow-inner"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 relative" ref={comboboxRef}>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest ml-1">Nationality</label>
            <div 
              className="w-full bg-slate-900/50 border border-slate-800 focus-within:border-cyan-500 rounded-xl px-4 py-3.5 flex justify-between items-center cursor-pointer transition-colors shadow-inner"
              onClick={() => setComboboxOpen(!comboboxOpen)}
            >
              <span className={`font-mono uppercase text-sm w-full truncate ${formData.nationality ? 'text-white' : 'text-slate-600'}`}>
                {formData.nationality || "Select Country"}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${comboboxOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
              {comboboxOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-50 top-[76px] left-[-20px] w-[220px] sm:w-[250px] md:w-full bg-[#020617] border border-cyan-500/30 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
                  style={{ maxHeight: '250px' }}
                >
                  <div className="p-3 border-b border-slate-800 flex items-center gap-2">
                    <Search className="w-4 h-4 text-cyan-500" />
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none text-white font-mono text-sm w-full placeholder:text-slate-600"
                      placeholder="Search country..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto w-full flex-1 no-scrollbar p-1">
                    {filteredCountries?.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-sm font-mono">No countries found</div>
                    ) : (
                      filteredCountries?.map((country) => (
                        <div
                          key={country.name.common}
                          className={`px-3 py-2.5 flex items-center gap-3 cursor-pointer rounded-lg transition-colors ${formData.nationality === country.name.common ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-slate-800/80 text-white'}`}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, nationality: country.name.common }));
                            setComboboxOpen(false);
                            setCountrySearch('');
                          }}
                        >
                          <span className="text-xl">{country.flag}</span>
                          <span className="font-mono text-sm truncate">{country.name.common}</span>
                          {formData.nationality === country.name.common && (
                            <Check className="w-4 h-4 ml-auto text-cyan-400 shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              placeholder="MM/YY"
              className="w-full bg-slate-900/50 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3.5 outline-none text-white font-mono placeholder:text-slate-600 transition-colors shadow-inner"
              required
            />
          </div>
        </div>

        <div className="mt-auto pt-8 pb-4">
          <motion.button
            type="submit"
            disabled={!isFormValid}
            whileTap={{ scale: 0.96 }}
            className={`w-full py-4 rounded-xl uppercase tracking-widest font-bold text-sm transition-all duration-300 relative overflow-hidden group ${isFormValid
              ? 'bg-cyan-500 hover:bg-cyan-400 text-[#020617] shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] cursor-pointer'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
              }`}
          >
            {isFormValid && (
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
            )}
            <span className="relative z-10">Verify & Continue</span>
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
