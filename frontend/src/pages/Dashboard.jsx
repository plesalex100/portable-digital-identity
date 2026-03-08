import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import QueueVisualization from '@/components/dashboard/QueueVisualization';
import TableView from '@/components/dashboard/TableView';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
    refetchInterval: 10000,
  });

  const { data: systemOnline = false } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 15000,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState('visual');
  const [search, setSearch] = useState('');

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const stats = useMemo(() => {
    const total = passengers.length;
    const cleared = passengers.filter((p) => ['passed-check-in', 'passed-immigration', 'at-duty-free', 'at-lounge', 'passed-gate'].includes(p.status)).length;
    const atGate = passengers.filter((p) => ['passed-gate'].includes(p.status)).length;
    const flights = new Set(passengers.map((p) => p.flightNumber)).size;
    return { total, cleared, atGate, flights };
  }, [passengers]);

  return (
    <div className="flex flex-col gap-6 w-full h-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Passenger Dashboard</h1>
          <p className="text-slate-700 text-xs font-medium flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-slate-700 animate-pulse" />
            Live — Auto-refresh 10s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
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

      {/* Controls: Search + View Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search name, flight, gate, nationality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-slate-400/50 focus:ring-1 focus:ring-primary/20 transition-colors"
          />
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
        <QueueVisualization passengers={passengers} search={search} />
      )}
      {!isLoading && !error && view === 'table' && (
        <TableView passengers={passengers} search={search} />
      )}
    </div>
  );
}
