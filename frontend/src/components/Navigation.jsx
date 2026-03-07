import { Link, useLocation } from 'react-router-dom';
import { Plane, ScanFace, CreditCard, LayoutDashboard } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();

  const links = [
    { name: 'Check-in', path: '/', icon: Plane },
    { name: 'Biometric', path: '/face-scan', icon: ScanFace },
    { name: 'My Pass', path: '/pass', icon: CreditCard },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <>
      {/* Top Header */}
      <nav className="sticky top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="flex justify-center items-center py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary">
            <Plane className="w-5 h-5" />
            SkyGate Airways
          </Link>
        </div>
      </nav>

      {/* Bottom Mobile Nav */}
      <nav className="sticky bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 flex justify-around items-center py-3 px-2 z-50">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`text-[11px] font-medium transition-colors duration-200 flex flex-col items-center gap-1 ${
                isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
