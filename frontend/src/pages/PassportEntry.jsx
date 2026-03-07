import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Network } from 'lucide-react';

export default function PassportEntry() {
  const navigate = useNavigate();
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
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest ml-1">Nationality</label>
            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              placeholder="USA"
              className="w-full bg-slate-900/50 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3.5 outline-none text-white font-mono placeholder:text-slate-600 transition-colors uppercase shadow-inner"
              required
            />
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
