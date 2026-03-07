import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PassportEntry from './pages/PassportEntry';
import FaceRecognition from './pages/FaceRecognition';
import FinalPass from './pages/FinalPass';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PassportEntry />} />
        <Route path="/face-scan" element={<FaceRecognition />} />
        <Route path="/pass" element={<FinalPass />} />
        <Route path="/dashboard" element={<AdminMonitor />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black sm:bg-slate-900 flex justify-center text-white font-sans selection:bg-cyan-500/30">
        {/* Mobile App Viewport Constraints - specifically Dark Mode #020617 */}
        <div className="w-full max-w-md bg-[#020617] h-[100dvh] relative shadow-[0_0_50px_rgba(8,145,178,0.15)] flex flex-col overflow-hidden sm:border-x sm:border-slate-800">

          <main className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth no-scrollbar relative w-full h-full">
            <AnimatedRoutes />
          </main>

        </div>
      </div>
    </Router>
  );
}
