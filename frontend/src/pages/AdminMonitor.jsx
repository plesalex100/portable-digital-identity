import { useState } from 'react';

export default function AdminMonitor() {
  const [liveFeed] = useState([
    { id: '1', passengerId: 'BIO-***9X2', location: 'Security Checkpoint A', matchScore: 98.7, timestamp: new Date(Date.now() - 5000), status: 'Pass' },
    { id: '2', passengerId: 'BIO-***3F1', location: 'Gate 42 Boarding', matchScore: 99.1, timestamp: new Date(Date.now() - 15000), status: 'Pass' },
    { id: '3', passengerId: 'UNKNOWN_***', location: 'Terminal 2 Entrance', matchScore: 42.1, timestamp: new Date(Date.now() - 45000), status: 'Alert' },
  ]);

  return (
    <div className="flex flex-col space-y-6 w-full pb-8">
      <div className="flex flex-col space-y-2 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black uppercase tracking-widest text-white">
          Overwatch-test
        </h1>
        <div className="flex justify-between items-center">
          <p className="text-cyan-500 font-mono text-xs flex items-center gap-2 tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_currentColor]"></span>
            LIVE FEED
          </p>
          <div className="text-right font-mono text-[10px] uppercase bg-slate-900/80 px-2 py-1 flex items-center gap-1.5 rounded border border-slate-800 text-slate-400">
            System <span className="text-emerald-400">Online</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {liveFeed.map((event) => (
          <div key={event.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-lg active:scale-[0.98] transition-all">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono font-bold tracking-wider text-slate-200 text-sm">
                  {event.passengerId}
                </div>
                <div className="text-cyan-200/60 text-xs mt-1">
                  @ {event.location}
                </div>
              </div>
              <div className={`px-2 py-1 rounded inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border ${event.status === 'Pass'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-500 border-red-500/30'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${event.status === 'Pass' ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'}`}></span>
                {event.status}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
              <div className="font-mono text-[10px] text-slate-500">
                {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${event.matchScore > 80 ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]'}`}
                    style={{ width: `${event.matchScore}%` }}
                  ></div>
                </div>
                <span className={`font-mono text-xs font-bold w-10 text-right ${event.matchScore > 80 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {event.matchScore.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        ))}

        {liveFeed.length === 0 && (
          <div className="p-8 text-center text-slate-600 font-mono text-xs uppercase tracking-widest bg-slate-900/50 rounded-xl border border-slate-800">
            [ waiting for feed ]
          </div>
        )}
      </div>
    </div>
  );
}
