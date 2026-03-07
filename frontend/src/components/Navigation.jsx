import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Enroll', path: '/enroll' },
    { name: 'Token', path: '/dashboard' },
    { name: 'Monitor', path: '/admin' },
  ];

  return (
    <>
      {/* Top Header */}
      <nav className="absolute top-0 left-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-cyan-900/40 shadow-[0_4px_30px_rgba(8,145,178,0.1)]">
        <div className="flex justify-center items-center py-4">
          <Link to="/" className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
            BIOTRAVEL
          </Link>
        </div>
      </nav>

      {/* Bottom Mobile Nav */}
      <nav className="absolute bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-md border-t border-cyan-900/60 flex justify-around items-center py-4 px-2 shadow-[0_-4px_20px_rgba(8,145,178,0.15)] z-50">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`text-[10px] font-bold tracking-widest uppercase transition-all duration-300 flex flex-col items-center gap-1.5 ${
              location.pathname === link.path 
                ? 'text-cyan-400 transform scale-105 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' 
                : 'text-slate-500 hover:text-cyan-300'
            }`}
          >
            <span>{link.name}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
