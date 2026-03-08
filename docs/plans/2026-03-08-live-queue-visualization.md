# Live Queue Visualization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Live Queue Visualization as the default dashboard view, with a tab toggle to switch between Visual and Table views.

**Architecture:** Extract the existing table view into its own component, create a new QueueVisualization component with horizontal lanes per status stage, and add a tab toggle in Dashboard.jsx. Passenger cards animate between lanes using Framer Motion layoutId.

**Tech Stack:** React 19, Framer Motion, Tailwind CSS v4, Lucide icons

---

### Task 1: Extract Table View into its own component

**Files:**
- Create: `frontend/src/components/dashboard/TableView.jsx`
- Modify: `frontend/src/pages/Dashboard.jsx`

**Step 1: Create TableView component**

Move the table rendering logic (tableHead, PassengerRow, GroupHeader, grouped view, pagination) out of Dashboard.jsx into a new `TableView` component. It receives these props:

```jsx
// frontend/src/components/dashboard/TableView.jsx
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ArrowUpDown,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react';

const STATUS_CONFIG = {
  'checked-in':           { label: 'Checked In',           color: 'bg-blue-500',    text: 'text-blue-600',    bg: 'bg-blue-50',      border: 'border-blue-200' },
  'passed-check-in':      { label: 'Passed Check-In',      color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50',   border: 'border-emerald-200' },
  'passed-immigration':   { label: 'Passed Immigration',   color: 'bg-teal-500',    text: 'text-teal-600',    bg: 'bg-teal-50',      border: 'border-teal-200' },
  'at-duty-free':         { label: 'At Duty-Free',         color: 'bg-amber-500',   text: 'text-amber-600',   bg: 'bg-amber-50',     border: 'border-amber-200' },
  'at-lounge':            { label: 'At Lounge',            color: 'bg-violet-500',  text: 'text-violet-600',  bg: 'bg-violet-50',    border: 'border-violet-200' },
  'passed-gate':          { label: 'Passed Gate',          color: 'bg-sky-500',     text: 'text-sky-600',     bg: 'bg-sky-50',       border: 'border-sky-200' },
};

const STATUS_ORDER = Object.keys(STATUS_CONFIG);

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['checked-in'];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.color}`} />
      {cfg.label}
    </span>
  );
}

function ScoreBar({ score }) {
  if (score == null) {
    return <span className="text-xs text-muted-foreground">Pending</span>;
  }
  const isLow = score < 70;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-400'}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-bold ${isLow ? 'text-red-500' : 'text-emerald-600'}`}>
        {Number(score).toFixed(1)}%
      </span>
    </div>
  );
}

function GroupHeader({ label, count, isOpen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 py-3 px-4 bg-slate-50 border-b border-border hover:bg-slate-100 transition-colors group"
    >
      {isOpen ? (
        <ChevronDown className="w-4 h-4 text-slate-500" />
      ) : (
        <ChevronRight className="w-4 h-4 text-slate-500" />
      )}
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <Badge variant="secondary" className="ml-auto text-[10px]">{count}</Badge>
    </button>
  );
}

function PassengerRow({ p }) {
  return (
    <tr className="border-b border-border hover:bg-slate-50 transition-colors">
      <td className="py-3 px-4">
        <div className="font-medium text-foreground text-sm">{p.name}</div>
        <div className="text-xs text-muted-foreground">{p.nationality}</div>
      </td>
      <td className="py-3 px-4">
        <div className="text-sm text-slate-700 font-bold">{p.flightNumber}</div>
        <div className="text-xs text-muted-foreground">{p.airline}</div>
      </td>
      <td className="py-3 px-4">
        <div className="text-sm text-foreground">{p.departure} → {p.arrival}</div>
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground">{p.gate}</td>
      <td className="py-3 px-4 text-sm text-muted-foreground">{p.seat}</td>
      <td className="py-3 px-4 text-xs text-muted-foreground">
        {p.boardingTime ? new Date(p.boardingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
      </td>
      <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
      <td className="py-3 px-4"><ScoreBar score={p.verificationScore} /></td>
    </tr>
  );
}

export default function TableView({ passengers, search }) {
  const [groupBy, setGroupBy] = useState('none');
  const [collapsed, setCollapsed] = useState({});
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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
      if (sortKey === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else if (sortKey === 'status') cmp = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      else if (sortKey === 'verificationScore') cmp = (a.verificationScore ?? 0) - (b.verificationScore ?? 0);
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

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
    return entries.map(([key, items]) => [key, applySorting(items)]);
  }, [filtered, groupBy, sortKey, sortDir]);

  const toggleGroup = (key) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const groupLabel = (key) => {
    if (groupBy === 'status') return STATUS_CONFIG[key]?.label || key;
    const p = passengers.find((p) => p.flightNumber === key);
    return `${key} — ${p?.airline || ''} (${p?.departure} → ${p?.arrival})`;
  };

  const SortIcon = ({ column }) => {
    if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 text-slate-600" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-slate-700" />
      : <ChevronDown className="w-3 h-3 text-slate-700" />;
  };

  const sortableThClass = "py-2 px-4 text-left font-medium cursor-pointer select-none hover:text-slate-300 transition-colors";
  const thClass = "py-2 px-4 text-left font-medium";

  const tableHead = (
    <thead>
      <tr className="border-b border-border text-xs text-muted-foreground">
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
    <>
      {/* Grouping controls */}
      <div className="flex gap-1 bg-slate-50 border border-border rounded-lg p-1">
        {[
          { key: 'none', label: 'No Grouping' },
          { key: 'status', label: 'By Status' },
          { key: 'flight', label: 'By Flight' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setGroupBy(key); setCollapsed({}); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              groupBy === key
                ? 'bg-slate-700/10 text-slate-700 border border-slate-400/30'
                : 'text-slate-500 hover:text-slate-700 border border-transparent'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        {groupBy === 'none' ? (
          <table className="w-full min-w-[900px]">
            {tableHead}
            <tbody>
              {paginated.map((p) => (
                <PassengerRow key={p._id} p={p} />
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col">
            {(() => {
              const allCollapsed = grouped?.every(([key]) => collapsed[key]);
              return (
                <div className="flex items-center justify-end px-4 py-2 border-b border-border">
                  <button
                    onClick={() => {
                      const next = {};
                      if (!allCollapsed) grouped?.forEach(([key]) => { next[key] = true; });
                      setCollapsed(next);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {allCollapsed ? (
                      <><ChevronsUpDown className="w-3.5 h-3.5" /> Expand All</>
                    ) : (
                      <><ChevronsDownUp className="w-3.5 h-3.5" /> Collapse All</>
                    )}
                  </button>
                </div>
              );
            })()}
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
          <div className="py-12 text-center text-muted-foreground text-sm">
            No passengers found
          </div>
        )}
      </div>

      {/* Pagination */}
      {groupBy === 'none' && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
          </p>
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {(() => {
                const pages = [];
                const maxVisible = 5;
                let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                let end = Math.min(totalPages, start + maxVisible - 1);
                if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
                if (start > 1) {
                  pages.push(
                    <PaginationItem key={1}>
                      <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer">1</PaginationLink>
                    </PaginationItem>
                  );
                  if (start > 2) pages.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
                }
                for (let i = start; i <= end; i++) {
                  pages.push(
                    <PaginationItem key={i}>
                      <PaginationLink isActive={i === currentPage} onClick={() => setCurrentPage(i)} className="cursor-pointer">
                        {i}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                if (end < totalPages) {
                  if (end < totalPages - 1) pages.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
                  pages.push(
                    <PaginationItem key={totalPages}>
                      <PaginationLink onClick={() => setCurrentPage(totalPages)} className="cursor-pointer">{totalPages}</PaginationLink>
                    </PaginationItem>
                  );
                }
                return pages;
              })()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
}
```

**Step 2: Verify the app still compiles**

Run: `cd frontend && pnpm dev`
Expected: No errors, dashboard still works with table view

**Step 3: Commit**

```bash
git add frontend/src/components/dashboard/TableView.jsx frontend/src/pages/Dashboard.jsx
git commit -m "refactor: extract TableView component from Dashboard"
```

---

### Task 2: Create QueueVisualization component

**Files:**
- Create: `frontend/src/components/dashboard/QueueVisualization.jsx`

**Step 1: Create the QueueVisualization component**

```jsx
// frontend/src/components/dashboard/QueueVisualization.jsx
import { useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STATUS_CONFIG = {
  'checked-in':           { label: 'Checked In',         color: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    ring: 'ring-blue-200' },
  'passed-check-in':      { label: 'Check-In',           color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-200' },
  'passed-immigration':   { label: 'Immigration',        color: 'bg-teal-500',    text: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200',    ring: 'ring-teal-200' },
  'at-duty-free':         { label: 'Duty-Free',          color: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   ring: 'ring-amber-200' },
  'at-lounge':            { label: 'Lounge',             color: 'bg-violet-500',  text: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200',  ring: 'ring-violet-200' },
  'passed-gate':          { label: 'At Gate',            color: 'bg-sky-500',     text: 'text-sky-700',     bg: 'bg-sky-50',     border: 'border-sky-200',     ring: 'ring-sky-200' },
};

const STATUS_ORDER = Object.keys(STATUS_CONFIG);
const MAX_VISIBLE = 8;

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function ScoreDot({ score }) {
  if (score == null) return <span className="w-2 h-2 rounded-full bg-slate-300" />;
  return <span className={`w-2 h-2 rounded-full ${score >= 70 ? 'bg-emerald-400' : 'bg-red-400'}`} />;
}

function PassengerCard({ passenger, statusConfig }) {
  return (
    <motion.div
      layoutId={passenger._id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className="flex items-center gap-2.5 bg-white rounded-lg border border-border/60 px-3 py-2 shadow-sm hover:shadow-md hover:border-border transition-all cursor-default"
    >
      <div className={`w-8 h-8 rounded-full ${statusConfig.bg} ${statusConfig.text} flex items-center justify-center text-[11px] font-bold shrink-0 ring-1 ${statusConfig.ring}`}>
        {getInitials(passenger.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground truncate">{passenger.name}</div>
        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
          <span className="font-semibold">{passenger.flightNumber}</span>
          <span>·</span>
          <span>{passenger.gate || '—'}</span>
        </div>
      </div>
      <ScoreDot score={passenger.verificationScore} />
    </motion.div>
  );
}

function QueueLane({ status, passengers, avgCount }) {
  const cfg = STATUS_CONFIG[status];
  const isCongested = passengers.length > avgCount * 1.5 && passengers.length > 3;
  const visible = passengers.slice(0, MAX_VISIBLE);
  const overflow = passengers.length - MAX_VISIBLE;

  return (
    <div className={`flex flex-col rounded-xl border ${cfg.border} ${cfg.bg}/30 min-w-[200px] flex-1`}>
      {/* Lane header */}
      <div className={`flex items-center gap-2 px-3 py-2.5 border-b ${cfg.border}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${cfg.color} ${isCongested ? 'animate-pulse' : ''}`} />
        <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
        <Badge variant="secondary" className="ml-auto text-[10px] tabular-nums">
          {passengers.length}
        </Badge>
        {isCongested && (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        )}
      </div>

      {/* Passenger cards */}
      <div className="flex flex-col gap-1.5 p-2 flex-1 min-h-[120px]">
        <AnimatePresence mode="popLayout">
          {visible.map((p) => (
            <PassengerCard key={p._id} passenger={p} statusConfig={cfg} />
          ))}
        </AnimatePresence>

        {overflow > 0 && (
          <div className={`text-center text-[11px] font-medium ${cfg.text} py-1.5 rounded-md ${cfg.bg}`}>
            +{overflow} more
          </div>
        )}

        {passengers.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/50">
            Empty
          </div>
        )}
      </div>
    </div>
  );
}

export default function QueueVisualization({ passengers, search }) {
  const filtered = useMemo(() => {
    if (!search.trim()) return passengers;
    const q = search.toLowerCase();
    return passengers.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.flightNumber?.toLowerCase().includes(q) ||
        p.gate?.toLowerCase().includes(q) ||
        p.nationality?.toLowerCase().includes(q) ||
        p.status?.toLowerCase().includes(q)
    );
  }, [passengers, search]);

  const lanes = useMemo(() => {
    const map = {};
    for (const status of STATUS_ORDER) map[status] = [];
    for (const p of filtered) {
      if (map[p.status]) map[p.status].push(p);
    }
    return map;
  }, [filtered]);

  const avgCount = useMemo(() => {
    const counts = STATUS_ORDER.map(s => lanes[s].length).filter(c => c > 0);
    return counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
  }, [lanes]);

  return (
    <div className="flex flex-col gap-3">
      {/* Flow direction indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <span>Passenger journey</span>
        <div className="flex-1 h-px bg-border" />
        <ChevronRight className="w-3.5 h-3.5" />
      </div>

      {/* Lanes */}
      <LayoutGroup>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {STATUS_ORDER.map((status, i) => (
            <div key={status} className="flex items-stretch">
              <QueueLane
                status={status}
                passengers={lanes[status]}
                avgCount={avgCount}
              />
              {i < STATUS_ORDER.length - 1 && (
                <div className="flex items-center px-1">
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </LayoutGroup>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-muted-foreground text-sm">
          No passengers found
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify the component has no import errors**

Run: `cd frontend && pnpm dev`
Expected: No errors (component not used yet, but imports should resolve)

**Step 3: Commit**

```bash
git add frontend/src/components/dashboard/QueueVisualization.jsx
git commit -m "feat: add QueueVisualization component with animated lane cards"
```

---

### Task 3: Update Dashboard with tab toggle

**Files:**
- Modify: `frontend/src/pages/Dashboard.jsx`

**Step 1: Rewrite Dashboard.jsx**

Replace the entire Dashboard.jsx with a simplified version that uses the two extracted components and adds the tab toggle. The tab state defaults to `'visual'`.

```jsx
// frontend/src/pages/Dashboard.jsx
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
  const [view, setView] = useState('visual'); // 'visual' | 'table'
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
```

**Step 2: Verify both views work**

Run: `cd frontend && pnpm dev`
Expected: Dashboard loads with Visual view by default, tab toggle switches to Table view, search works in both views

**Step 3: Commit**

```bash
git add frontend/src/pages/Dashboard.jsx
git commit -m "feat: add Visual/Table tab toggle with live queue visualization as default"
```
