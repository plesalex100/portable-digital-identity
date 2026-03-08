import { useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STATUS_CONFIG = {
  'checked-in':         { label: 'Checked In',    color: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    ring: 'ring-blue-200' },
  'passed-check-in':    { label: 'Check-In',      color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-200' },
  'passed-immigration': { label: 'Immigration',   color: 'bg-teal-500',    text: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200',    ring: 'ring-teal-200' },
  'at-duty-free':       { label: 'Duty-Free',     color: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   ring: 'ring-amber-200' },
  'at-lounge':          { label: 'Lounge',         color: 'bg-violet-500',  text: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200',  ring: 'ring-violet-200' },
  'passed-gate':        { label: 'At Gate',        color: 'bg-sky-500',     text: 'text-sky-700',     bg: 'bg-sky-50',     border: 'border-sky-200',     ring: 'ring-sky-200' },
};
const STATUS_ORDER = Object.keys(STATUS_CONFIG);

const MAX_VISIBLE = 8;

function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function ScoreDot({ score }) {
  const color =
    score == null
      ? 'bg-gray-300'
      : score >= 70
        ? 'bg-green-500'
        : 'bg-red-500';
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

function PassengerCard({ passenger, config }) {
  return (
    <motion.div
      layoutId={passenger._id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className="flex items-center gap-2 rounded-lg border bg-white p-2 shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${config.color}`}
      >
        {getInitials(passenger.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-gray-900">
          {passenger.name}
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          {passenger.flightNumber && <span>{passenger.flightNumber}</span>}
          {passenger.gate && (
            <>
              <span className="text-gray-300">|</span>
              <span>{passenger.gate}</span>
            </>
          )}
        </div>
      </div>
      <ScoreDot score={passenger.score ?? passenger.verificationScore ?? null} />
    </motion.div>
  );
}

function QueueLane({ status, config, passengers, averageCount }) {
  const count = passengers.length;
  const isCongested = count > averageCount * 1.5 && count > 3;
  const visible = passengers.slice(0, MAX_VISIBLE);
  const overflow = count - MAX_VISIBLE;

  return (
    <div
      className={`flex min-h-[120px] flex-1 flex-col rounded-xl border ${config.border} ${config.bg} p-3`}
    >
      {/* Header */}
      <div className="mb-2 flex items-center gap-1.5">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${config.color} ${isCongested ? 'animate-pulse' : ''}`}
        />
        <span className={`text-xs font-semibold ${config.text}`}>
          {config.label}
        </span>
        <Badge className="ml-auto text-[10px]">{count}</Badge>
        {isCongested && (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        )}
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-1.5">
        {count === 0 ? (
          <p className="flex flex-1 items-center justify-center text-xs text-gray-400">
            Empty
          </p>
        ) : (
          <AnimatePresence mode="popLayout">
            {visible.map((p) => (
              <PassengerCard key={p._id} passenger={p} config={config} />
            ))}
          </AnimatePresence>
        )}
        {overflow > 0 && (
          <div className="mt-1 text-center">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color} text-white`}
            >
              +{overflow} more
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QueueVisualization({ passengers = [], search = '' }) {
  const filtered = useMemo(() => {
    if (!search.trim()) return passengers;
    const q = search.toLowerCase();
    return passengers.filter((p) => {
      const fields = [
        p.name,
        p.flightNumber,
        p.gate,
        p.nationality,
        p.status,
      ];
      return fields.some((f) => f && String(f).toLowerCase().includes(q));
    });
  }, [passengers, search]);

  const grouped = useMemo(() => {
    const map = {};
    for (const s of STATUS_ORDER) map[s] = [];
    for (const p of filtered) {
      if (map[p.status]) map[p.status].push(p);
    }
    return map;
  }, [filtered]);

  const averageCount = useMemo(() => {
    const total = STATUS_ORDER.reduce((s, k) => s + grouped[k].length, 0);
    return total / STATUS_ORDER.length;
  }, [grouped]);

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium">Passenger journey</span>
        <ChevronRight className="h-4 w-4" />
      </div>

      {/* Lanes */}
      <LayoutGroup>
        <div className="flex items-stretch gap-2">
          {STATUS_ORDER.map((status, i) => (
            <div key={status} className="flex flex-1 items-stretch">
              <QueueLane
                status={status}
                config={STATUS_CONFIG[status]}
                passengers={grouped[status]}
                averageCount={averageCount}
              />
              {i < STATUS_ORDER.length - 1 && (
                <div className="flex items-center px-1">
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
}
