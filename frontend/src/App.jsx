import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PassportEntry from './pages/PassportEntry';
import FaceRecognition from './pages/FaceRecognition';
import FinalPass from './pages/FinalPass';
import AdminMonitor from './pages/AdminMonitor';
import Verification from './pages/Verification';
import Dashboard from './pages/Dashboard';


const FULL_WIDTH_ROUTES = ['/activity'];

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PassportEntry />} />
        <Route path="/face-scan" element={<FaceRecognition />} />
        <Route path="/pass" element={<FinalPass />} />
        <Route path="/verify" element={<Verification />} />
        <Route path="/dashboard" element={<AdminMonitor />} />
        <Route path="/activity" element={<Dashboard />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const location = useLocation();
  const isFullWidth = FULL_WIDTH_ROUTES.includes(location.pathname);

  if (isFullWidth) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
        <AnimatedRoutes />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 sm:bg-slate-200 flex justify-center text-foreground font-sans selection:bg-primary/20">
      {/* Mobile App Viewport */}
      <div className="w-full h-[100dvh] relative shadow-xl flex flex-col overflow-hidden sm:border-x sm:border-slate-200">

        <main className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth no-scrollbar relative w-full h-full">
          <AnimatedRoutes />
        </main>

      </div>
    </div>
  );
}
