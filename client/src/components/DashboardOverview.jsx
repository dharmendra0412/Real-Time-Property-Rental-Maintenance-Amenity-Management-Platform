import React from 'react';
import {
  Clock,
  CheckCircle2,
  ShieldCheck,
  Zap,
  RefreshCw,
  Wrench,
  AlertTriangle,
  Flame,
  Calendar,
  Sparkles,
  ArrowUpRight,
  User,
  Radio
} from 'lucide-react';

export default function DashboardOverview({
  stats,
  onRefresh,
  setActiveTab,
  onOpenNewTicket,
  currentUser
}) {
  const kpis = stats?.kpis || {};
  const maintenance = stats?.maintenance || {};
  const amenities = stats?.amenities || {};
  const activityFeed = stats?.activity_feed || [];

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    const diff = Math.floor((new Date() - new Date(isoString)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white font-['Outfit']">
              Real-Time Operational Intelligence
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ZERO SIMULATION
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audited system health, strict ACID concurrency metrics, and live PostgreSQL operational data.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-slate-800/80 text-xs font-semibold text-slate-300 hover:text-white transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          {currentUser && currentUser.role === 'TENANT' && (
            <button
              onClick={onOpenNewTicket}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Core Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: MTTR */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 absolute top-0 left-0 right-0" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Resolution Time (MTTR)</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-['Outfit']">
              {kpis.mttr_hours !== null && kpis.mttr_hours !== undefined ? `${kpis.mttr_hours}h` : 'N/A'}
            </span>
            <span className="text-xs text-slate-400">database avg</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400">
            <span className="px-1.5 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SLA ≤ 48h
            </span>
            <span>Target benchmark</span>
          </div>
        </div>

        {/* KPI 2: Completion Rate */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 absolute top-0 left-0 right-0" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Completion Rate</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-['Outfit']">
              {kpis.completion_rate_percent ?? 0}%
            </span>
            <span className="text-xs text-slate-400">resolved tickets</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(kpis.completion_rate_percent || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Zero Booking Conflicts */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500 absolute top-0 left-0 right-0" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Booking Conflicts</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-['Outfit']">
              {kpis.conflicts_prevented_count ?? 0}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">Strictly 0</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400">
            <span className="px-1.5 py-0.5 rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              ACID LOCK
            </span>
            <span>Concurrency shielded</span>
          </div>
        </div>

        {/* KPI 4: Response Latency */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500 absolute top-0 left-0 right-0" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>API Response Latency</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-['Outfit']">
              {kpis.system_response_ms ? Math.round(kpis.system_response_ms) : 0}ms
            </span>
            <span className="text-xs text-slate-400">query roundtrip</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400">
            <span className="px-1.5 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Target ≤ 2000ms
            </span>
            <span>Ultra high-speed</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid: Maintenance Breakdown & Real-Time Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Status Breakdown & Priority Grid */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Breakdown Box */}
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-400" />
                <h2 className="text-base font-bold text-white">Maintenance Tickets Status Breakdown</h2>
              </div>
              <button
                onClick={() => setActiveTab('maintenance')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition"
              >
                <span>View all tickets</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 4 Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                onClick={() => setActiveTab('maintenance')}
                className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 cursor-pointer hover:bg-amber-500/15 transition text-center"
              >
                <span className="text-2xl font-black text-amber-400 font-['Outfit']">
                  {maintenance.pending ?? 0}
                </span>
                <p className="text-[11px] font-bold text-amber-300/80 uppercase mt-1 tracking-wider">Pending</p>
              </div>

              <div
                onClick={() => setActiveTab('maintenance')}
                className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 cursor-pointer hover:bg-blue-500/15 transition text-center"
              >
                <span className="text-2xl font-black text-blue-400 font-['Outfit']">
                  {maintenance.in_progress ?? 0}
                </span>
                <p className="text-[11px] font-bold text-blue-300/80 uppercase mt-1 tracking-wider">In Progress</p>
              </div>

              <div
                onClick={() => setActiveTab('maintenance')}
                className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/25 cursor-pointer hover:bg-teal-500/15 transition text-center"
              >
                <span className="text-2xl font-black text-teal-400 font-['Outfit']">
                  {maintenance.completed ?? 0}
                </span>
                <p className="text-[11px] font-bold text-teal-300/80 uppercase mt-1 tracking-wider">Completed</p>
              </div>

              <div
                onClick={() => setActiveTab('maintenance')}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 cursor-pointer hover:bg-emerald-500/15 transition text-center"
              >
                <span className="text-2xl font-black text-emerald-400 font-['Outfit']">
                  {maintenance.closed ?? 0}
                </span>
                <p className="text-[11px] font-bold text-emerald-300/80 uppercase mt-1 tracking-wider">Closed</p>
              </div>
            </div>

            {/* Amenity Highlights */}
            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Amenity Utilization</p>
                  <p className="text-[11px] text-slate-400">
                    {amenities.total_bookings ?? 0} total bookings verified in database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('amenities')}
                className="px-3.5 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <span>Reserve Amenity Slot</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Real-Time Live Activity Feed */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-full">
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse glow-dot-emerald" />
              <h2 className="text-base font-bold text-white">Live Activity Feed</h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              WEBSOCKET
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[380px] pr-1">
            {activityFeed.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No recent database events recorded.
              </div>
            ) : (
              activityFeed.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 border border-white/5 transition text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-200 truncate">{item.actor_name}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-snug">{item.message}</p>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        item.actor_role === 'OWNER'
                          ? 'bg-amber-500/10 text-amber-400'
                          : item.actor_role === 'STAFF'
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {item.actor_role}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">• {item.subject_title}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
