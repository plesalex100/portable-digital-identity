import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import {
  Plane,
  Users,
  ShieldAlert,
  ShieldCheck,
  Clock,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ArrowUpDown,
  Search,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const STATUS_CONFIG = {
  'checked-in':         { label: 'Checked In',        color: 'bg-blue-500',    text: 'text-blue-400',    bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  'security-screening': { label: 'Security Screening', color: 'bg-yellow-500',  text: 'text-yellow-400',  bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  'security-cleared':   { label: 'Security Cleared',  color: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10',border: 'border-emerald-500/30' },
  'at-gate':            { label: 'At Gate',            color: 'bg-cyan-500',    text: 'text-cyan-400',    bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30' },
  'boarding':           { label: 'Boarding',           color: 'bg-purple-500',  text: 'text-purple-400',  bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  'boarded':            { label: 'Boarded',            color: 'bg-slate-500',   text: 'text-slate-400',   bg: 'bg-slate-500/10',  border: 'border-slate-500/30' },
  'flagged':            { label: 'Flagged',            color: 'bg-red-500',     text: 'text-red-400',     bg: 'bg-red-500/10',    border: 'border-red-500/30' },
};

const STATUS_ORDER = Object.keys(STATUS_CONFIG);

const fetchPassengers = async () => {
  const res = await fetch(`${API_BASE}/api/passengers`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch');
  return json.data;
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['checked-in'];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.color} ${status === 'flagged' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
}

function ScoreBar({ score }) {
  const isLow = score < 70;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-400'}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`font-mono text-xs font-bold ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>
        {score}%
      </span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent = 'text-cyan-400' }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-slate-800/80 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label}</div>
        <div className="text-xl font-bold text-white font-mono">{value}</div>
      </div>
    </div>
  );
}

function GroupHeader({ label, count, isOpen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 py-3 px-4 bg-slate-900/80 border border-slate-800 rounded-lg hover:bg-slate-800/80 transition-colors group"
    >
      {isOpen ? (
        <ChevronDown className="w-4 h-4 text-slate-500" />
      ) : (
        <ChevronRight className="w-4 h-4 text-slate-500" />
      )}
      <span className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider">{label}</span>
      <Badge variant="secondary" className="ml-auto text-[10px]">{count}</Badge>
    </button>
  );
}

function PassengerRow({ p }) {
  return (
    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
      <td className="py-3 px-4">
        <div className="font-medium text-slate-200 text-sm">{p.name}</div>
        <div className="text-[10px] font-mono text-slate-500">{p.nationality}</div>
      </td>
      <td className="py-3 px-4">
        <div className="font-mono text-sm text-cyan-400 font-bold">{p.flightNumber}</div>
        <div className="text-[10px] font-mono text-slate-500">{p.airline}</div>
      </td>
      <td className="py-3 px-4">
        <div className="font-mono text-sm text-slate-300">{p.departure} → {p.arrival}</div>
      </td>
      <td className="py-3 px-4 font-mono text-sm text-slate-400">{p.gate}</td>
      <td className="py-3 px-4 font-mono text-sm text-slate-400">{p.seat}</td>
      <td className="py-3 px-4 font-mono text-xs text-slate-400">
        {p.boardingTime ? new Date(p.boardingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
      </td>
      <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
      <td className="py-3 px-4"><ScoreBar score={p.verificationScore} /></td>
    </tr>
  );
}

export default function Dashboard() {
  const { data: passengers = [], isLoading, error } = useQuery({
    queryKey: ['passengers'],
    queryFn: fetchPassengers,
    refetchInterval: 10000,
  });

  const [groupBy, setGroupBy] = useState('none'); // 'none' | 'status' | 'flight'
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const [sortKey, setSortKey] = useState(null); // 'name' | 'status' | 'verificationScore'
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'verificationScore' ? 'desc' : 'asc');
    }
  };

  const applySorting = (list) => {
    if (!sortKey) return list;
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = (a.name || '').localeCompare(b.name || '');
      } else if (sortKey === 'status') {
        cmp = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      } else if (sortKey === 'verificationScore') {
        cmp = (a.verificationScore ?? 0) - (b.verificationScore ?? 0);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  };

  const filtered = useMemo(() => {
    let list = passengers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.flightNumber?.toLowerCase().includes(q) ||
          p.gate?.toLowerCase().includes(q) ||
          p.nationality?.toLowerCase().includes(q) ||
          p.status?.toLowerCase().includes(q)
      );
    }
    return applySorting(list);
  }, [passengers, search, sortKey, sortDir]);

  const grouped = useMemo(() => {
    if (groupBy === 'none') return null;
    const map = {};
    for (const p of filtered) {
      const key = groupBy === 'status' ? p.status : p.flightNumber;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    const entries = Object.entries(map);
    if (groupBy === 'status') {
      entries.sort((a, b) => STATUS_ORDER.indexOf(a[0]) - STATUS_ORDER.indexOf(b[0]));
    } else {
      entries.sort((a, b) => a[0].localeCompare(b[0]));
    }
    // Apply column sorting within each group
    return entries.map(([key, items]) => [key, applySorting(items)]);
  }, [filtered, groupBy, sortKey, sortDir]);

  const stats = useMemo(() => {
    const total = passengers.length;
    const flagged = passengers.filter((p) => p.status === 'flagged').length;
    const cleared = passengers.filter((p) => ['security-cleared', 'at-gate', 'boarding', 'boarded'].includes(p.status)).length;
    const flights = new Set(passengers.map((p) => p.flightNumber)).size;
    return { total, flagged, cleared, flights };
  }, [passengers]);

  const toggleGroup = (key) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const groupLabel = (key) => {
    if (groupBy === 'status') {
      return STATUS_CONFIG[key]?.label || key;
    }
    const p = passengers.find((p) => p.flightNumber === key);
    return `${key} — ${p?.airline || ''} (${p?.departure} → ${p?.arrival})`;
  };

  const SortIcon = ({ column }) => {
    if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 text-slate-600" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-cyan-400" />
      : <ChevronDown className="w-3 h-3 text-cyan-400" />;
  };

  const sortableThClass = "py-2 px-4 text-left font-medium cursor-pointer select-none hover:text-slate-300 transition-colors";
  const thClass = "py-2 px-4 text-left font-medium";

  const tableHead = (
    <thead>
      <tr className="border-b border-slate-700 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
        <th className={sortableThClass} onClick={() => toggleSort('name')}>
          <span className="inline-flex items-center gap-1">Passenger <SortIcon column="name" /></span>
        </th>
        <th className={thClass}>Flight</th>
        <th className={thClass}>Route</th>
        <th className={thClass}>Gate</th>
        <th className={thClass}>Seat</th>
        <th className={thClass}>Boarding</th>
        <th className={sortableThClass} onClick={() => toggleSort('status')}>
          <span className="inline-flex items-center gap-1">Status <SortIcon column="status" /></span>
        </th>
        <th className={sortableThClass} onClick={() => toggleSort('verificationScore')}>
          <span className="inline-flex items-center gap-1">Verification <SortIcon column="verificationScore" /></span>
        </th>
      </tr>
    </thead>
  );

  return (
    <div className="flex flex-col gap-6 w-full h-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-white">
            Activity Dashboard
          </h1>
          <p className="text-cyan-500 font-mono text-xs flex items-center gap-2 tracking-wider mt-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_currentColor]" />
            LIVE — Auto-refresh 10s
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          System <span className="text-emerald-400 ml-1">Online</span>
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Passengers" value={stats.total} />
        <StatCard icon={Plane} label="Active Flights" value={stats.flights} accent="text-purple-400" />
        <StatCard icon={ShieldCheck} label="Cleared" value={stats.cleared} accent="text-emerald-400" />
        <StatCard icon={ShieldAlert} label="Flagged" value={stats.flagged} accent="text-red-400" />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search name, flight, gate, nationality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-lg font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
          />
        </div>
        <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-lg p-1">
          {[
            { key: 'none', label: 'No Grouping' },
            { key: 'status', label: 'By Status' },
            { key: 'flight', label: 'By Flight' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setGroupBy(key); setCollapsed({}); }}
              className={`px-3 py-1.5 rounded-md font-mono text-[11px] font-bold uppercase tracking-wider transition-all ${
                groupBy === key
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-500 font-mono text-sm">
          <Clock className="w-4 h-4 animate-spin mr-2" /> Loading passengers...
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 font-mono text-sm">
          Failed to load: {error.message}
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
          {groupBy === 'none' ? (
            <table className="w-full min-w-[900px]">
              {tableHead}
              <tbody>
                {filtered.map((p) => (
                  <PassengerRow key={p._id} p={p} />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col">
              {grouped?.map(([key, items]) => (
                <div key={key}>
                  <GroupHeader
                    label={groupLabel(key)}
                    count={items.length}
                    isOpen={!collapsed[key]}
                    onToggle={() => toggleGroup(key)}
                  />
                  {!collapsed[key] && (
                    <table className="w-full min-w-[900px]">
                      {tableHead}
                      <tbody>
                        {items.map((p) => (
                          <PassengerRow key={p._id} p={p} />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-600 font-mono text-xs uppercase tracking-widest">
              No passengers found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
