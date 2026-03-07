import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PassportEntry from './pages/PassportEntry';
import FaceRecognition from './pages/FaceRecognition';
import CheckedIn from './pages/CheckedIn';
import FinalPass from './pages/FinalPass';
import Verification from './pages/Verification';
import Dashboard from './pages/Dashboard';


const FULL_WIDTH_ROUTES = ['/activity', '/dashboard'];

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PassportEntry />} />
        <Route path="/checked-in" element={<CheckedIn />} />
        <Route path="/face-scan" element={<FaceRecognition />} />
        <Route path="/pass" element={<FinalPass />} />
        <Route path="/verify" element={<Verification />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const location = useLocation();
  const isFullWidth = FULL_WIDTH_ROUTES.includes(location.pathname);

  if (isFullWidth) {
    return (
      <div className="min-h-screen text-foreground font-sans">
        <AnimatedRoutes />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex justify-center text-foreground font-sans">
      {/* Mobile App Viewport */}
      <div className="w-full max-w-2xl h-[100dvh] relative shadow-xl flex flex-col overflow-hidden sm:border-x">

        <main className="flex flex-1 overflow-x-hidden overflow-y-auto scroll-smooth no-scrollbar relative w-full h-full">
          <AnimatedRoutes />
        </main>

      </div>
    </div>
  );
}
