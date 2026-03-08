import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import {
  Plane,
  Users,
  ShieldCheck,
  Clock,
  RefreshCw,
  Search,
  LayoutGrid,
  Table,
  Play,
  Square,
  ChevronDown,
} from 'lucide-react';
import QueueVisualization from '@/components/dashboard/QueueVisualization';
import TableView from '@/components/dashboard/TableView';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const SIMULATION_PIPELINE = [
  'checked-in',
  'passed-security-gate',
  'passed-immigration',
  'at-duty-free',
  'at-lounge',
  'passed-gate',
];

function getNextStatus(current) {
  const idx = SIMULATION_PIPELINE.indexOf(current);
  if (idx === -1 || idx === SIMULATION_PIPELINE.length - 1) return 'checked-in';
  // After immigration, randomly go to duty-free, lounge, or skip to gate
  if (current === 'passed-immigration') {
    const roll = Math.random();
    if (roll < 0.3) return 'at-duty-free';
    if (roll < 0.5) return 'at-lounge';
    return 'passed-gate';
  }
  // From duty-free or lounge, go to gate
  if (current === 'at-duty-free' || current === 'at-lounge') return 'passed-gate';
  return SIMULATION_PIPELINE[idx + 1];
}

const fetchHealth = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/face/health`);
    if (!res.ok) return false;
    const json = await res.json();
    return json.success === true;
  } catch {
    return false;
  }
};

const fetchPassengers = async () => {
  const res = await fetch(`${API_BASE}/api/passengers`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch');
  return json.data;
};

function StatCard({ icon: Icon, label, value, accent = 'text-slate-700' }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-sm">
      <div className={`p-2 rounded-lg bg-slate-100 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: passengers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['passengers'],
    queryFn: fetchPassengers,
    refetchInterval: 2000,
  });

  const { data: systemOnline = false } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 15000,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState('visual');
  const [search, setSearch] = useState('');
  const [selectedFlight, setSelectedFlight] = useState('all');
  const [simulating, setSimulating] = useState(false);
  const [simPassengers, setSimPassengers] = useState(null);
  const intervalRef = useRef(null);

  // Seed simulation state from API data when toggled on
  const startSimulation = useCallback(() => {
    setSimPassengers(passengers.map((p) => ({ ...p })));
    setSimulating(true);
  }, [passengers]);

  const stopSimulation = useCallback(() => {
    setSimulating(false);
    setSimPassengers(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Advance 1-3 random passengers each tick
  useEffect(() => {
    if (!simulating || !simPassengers?.length) return;

    intervalRef.current = setInterval(() => {
      setSimPassengers((prev) => {
        const next = prev.map((p) => ({ ...p }));
        const count = Math.floor(Math.random() * 3) + 2;
        const indices = new Set();
        while (indices.size < Math.min(count, next.length)) {
          indices.add(Math.floor(Math.random() * next.length));
        }
        for (const i of indices) {
          const newStatus = getNextStatus(next[i].status);
          if (next[i].status === 'passed-gate' && newStatus === 'checked-in') {
            next[i]._id = next[i]._id.split('--sim')[0] + '--sim' + Date.now() + '-' + i;
          }
          next[i].status = newStatus;
        }
        return next;
      });
    }, 615);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [simulating, simPassengers?.length]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const rawPassengers = simulating && simPassengers ? simPassengers : passengers;

  const flights = useMemo(() => {
    const flightSet = new Map();
    for (const p of rawPassengers) {
      if (p.flightNumber && !flightSet.has(p.flightNumber)) {
        flightSet.set(p.flightNumber, p.airline || '');
      }
    }
    return Array.from(flightSet.entries())
      .map(([num, airline]) => ({ num, airline }))
      .sort((a, b) => a.num.localeCompare(b.num));
  }, [rawPassengers]);

  const activePassengers = useMemo(() => {
    if (selectedFlight === 'all') return rawPassengers;
    return rawPassengers.filter((p) => p.flightNumber === selectedFlight);
  }, [rawPassengers, selectedFlight]);

  const stats = useMemo(() => {
    const total = activePassengers.length;
    const cleared = activePassengers.filter((p) => ['passed-security-gate', 'passed-immigration', 'at-duty-free', 'at-lounge', 'passed-gate'].includes(p.status)).length;
    const atGate = activePassengers.filter((p) => ['passed-gate'].includes(p.status)).length;
    const flightCount = new Set(activePassengers.map((p) => p.flightNumber)).size;
    return { total, cleared, atGate, flights: flightCount };
  }, [activePassengers]);

  return (
    <div className="flex flex-col gap-6 w-full h-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Passenger Dashboard</h1>
          <p className="text-slate-700 text-xs font-medium flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${simulating ? 'bg-amber-500' : 'bg-slate-700'} animate-pulse`} />
            {simulating ? 'Simulation Mode' : 'Live — Auto-refresh 2s'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Simulate toggle */}
          <button
            onClick={simulating ? stopSimulation : startSimulation}
            disabled={!passengers.length}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              simulating
                ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                : 'border-border text-muted-foreground hover:bg-slate-100'
            } disabled:opacity-50`}
          >
            {simulating ? (
              <><Square className="w-3 h-3" /> Stop</>
            ) : (
              <><Play className="w-3 h-3" /> Simulate</>
            )}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing || simulating}
            className="p-2 rounded-lg border border-border hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Badge variant="secondary" className="text-[10px]">
            System{' '}
            <span className={`ml-1 ${systemOnline ? 'text-emerald-600' : 'text-red-500'}`}>
              {systemOnline ? 'Online' : 'Offline'}
            </span>
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Passengers" value={stats.total} />
        <StatCard icon={Plane} label="Active Flights" value={stats.flights} accent="text-purple-400" />
        <StatCard icon={ShieldCheck} label="Cleared" value={stats.cleared} accent="text-emerald-400" />
        <StatCard icon={Clock} label="At Gate" value={stats.atGate} accent="text-sky-400" />
      </div>

      {/* Controls: Search + Flight Filter + View Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search name, gate, nationality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-slate-400/50 focus:ring-1 focus:ring-primary/20 transition-colors"
          />
        </div>
        <div className="relative">
          <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <select
            value={selectedFlight}
            onChange={(e) => setSelectedFlight(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2.5 bg-white border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:border-slate-400/50 focus:ring-1 focus:ring-primary/20 transition-colors cursor-pointer"
          >
            <option value="all">All Flights</option>
            {flights.map(({ num, airline }) => (
              <option key={num} value={num}>
                {num}{airline ? ` — ${airline}` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
        <div className="flex gap-1 bg-slate-50 border border-border rounded-lg p-1">
          {[
            { key: 'visual', label: 'Visual', icon: LayoutGrid },
            { key: 'table', label: 'Table', icon: Table },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === key
                  ? 'bg-slate-700/10 text-slate-700 border border-slate-400/30'
                  : 'text-slate-500 hover:text-slate-700 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          <Clock className="w-4 h-4 animate-spin mr-2" /> Loading passengers...
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 font-mono text-sm">
          Failed to load: {error.message}
        </div>
      )}

      {/* View content */}
      {!isLoading && !error && view === 'visual' && (
        <QueueVisualization passengers={activePassengers} search={search} />
      )}
      {!isLoading && !error && view === 'table' && (
        <TableView passengers={activePassengers} search={search} />
      )}
    </div>
  );
}
