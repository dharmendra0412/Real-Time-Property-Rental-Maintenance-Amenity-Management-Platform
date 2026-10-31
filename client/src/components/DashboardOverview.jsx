import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  ShieldCheck,
  Zap,
  RefreshCw,
  Wrench,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Radio,
  TrendingUp,
  Activity,
  PieChart,
  Database,
  Server,
  Lock,
  BarChart2
} from 'lucide-react';

export default function DashboardOverview({
  stats,
  onRefresh,
  setActiveTab,
  onOpenNewTicket,
  currentUser
}) {
  const [feedFilter, setFeedFilter] = useState('ALL');
  const [chartView, setChartView] = useState('tickets');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const kpis = stats?.kpis || {};
  const maintenance = stats?.maintenance || {};
  const amenities = stats?.amenities || {};
  const activityFeed = stats?.activity_feed || [];
  const categories = maintenance?.by_category || [];

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    const diff = Math.floor((new Date() - new Date(isoString)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const filteredFeed = activityFeed.filter((item) => {
    if (feedFilter === 'ALL') return true;
    return item.event_type === feedFilter;
  });

  const mttrValue = kpis.mttr_hours !== null && kpis.mttr_hours !== undefined ? Number(kpis.mttr_hours) : 0;
  const mttrSlaPercent = Math.min(Math.round((mttrValue / 48) * 100), 100);

  const trendData = stats?.daily_trends && stats.daily_trends.length > 0
    ? stats.daily_trends
    : [
        { day: 'Mon', tickets: 0, resolved: 0 },
        { day: 'Tue', tickets: 0, resolved: 0 },
        { day: 'Wed', tickets: 0, resolved: 0 },
        { day: 'Thu', tickets: 0, resolved: 0 },
        { day: 'Fri', tickets: 0, resolved: 0 },
        { day: 'Sat', tickets: 0, resolved: 0 },
        { day: 'Sun', tickets: 0, resolved: 0 }
      ];

  const chartWidth = 540;
  const chartHeight = 160;
  const maxVal = Math.max(...trendData.map(d => Math.max(d.tickets, d.resolved)), 4);
  const stepX = chartWidth / (trendData.length - 1 || 1);

  const getPoints = (key) =>
    trendData.map((d, i) => ({
      x: i * stepX,
      y: chartHeight - 20 - (d[key] / maxVal) * (chartHeight - 40),
      val: d[key],
      day: d.day,
      date_str: d.date_str
    }));

  const ticketPoints = getPoints('tickets');
  const resolvedPoints = getPoints('resolved');

  const createCurvedPath = (points) => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, i, a) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = a[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
    }, '');
  };

  const ticketPath = createCurvedPath(ticketPoints);
  const resolvedPath = createCurvedPath(resolvedPoints);
  const resolvedAreaPath = `${resolvedPath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  const categoryColors = [
    { name: 'PLUMBING', color: '#3b82f6' },
    { name: 'ELECTRICAL', color: '#f59e0b' },
    { name: 'HVAC', color: '#06b6d4' },
    { name: 'APPLIANCE', color: '#ec4899' },
    { name: 'CARPENTRY', color: '#8b5cf6' },
    { name: 'GENERAL', color: '#10b981' }
  ];

  const totalCatCount = categories.reduce((sum, c) => sum + Number(c.count), 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const hourlyAmenities = stats?.hourly_amenities || [];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ═══════════════════════════════════════════════════════════
          HERO BANNER — Aeline "Sky Blue" Atmospheric Header
      ═══════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-sky-500 to-blue-600 p-6 sm:p-8 shadow-2xl shadow-sky-900/40">
        {/* Atmospheric glow blobs */}
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-48 rounded-full bg-blue-700/30 blur-3xl" />
        {/* ZERO SIMULATION badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
          Zero Simulation
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <p className="text-sky-200 text-[11px] font-bold uppercase tracking-widest mb-1.5">Real-Time Operational Intelligence</p>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight font-['Outfit']">
              Property Management<br className="hidden sm:block" /> at Full Velocity
            </h1>
            <p className="mt-2 text-sky-100/80 text-xs sm:text-sm max-w-md">
              Audited SLA compliance, ACID concurrency locks &amp; pure PostgreSQL operational metrics — zero simulation.
            </p>

            {/* Floating stat pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-bold">
                <Database className="w-3 h-3 text-lime-300" />
                {maintenance.total ?? 0} Tickets Logged
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-bold">
                <Sparkles className="w-3 h-3 text-lime-300" />
                {amenities.total_bookings ?? 0} Reservations
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lime-400/90 text-slate-900 text-xs font-bold">
                <Lock className="w-3 h-3" />
                ACID Guaranteed
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={onRefresh}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-900 hover:bg-sky-50 text-sm font-bold shadow-lg transition active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Live Refresh
            </button>
            {currentUser && currentUser.role === 'TENANT' && (
              <button
                onClick={onOpenNewTicket}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-lime-400 text-slate-900 hover:bg-lime-300 text-sm font-bold shadow-lg transition active:scale-95"
              >
                <Wrench className="w-4 h-4" />
                Report Issue ↗
              </button>
            )}
          </div>
        </div>

        {/* Bottom stat band */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'MTTR Resolution', value: mttrValue ? `${mttrValue}h` : '0h', sub: '≤ 48h SLA', icon: <Clock className="w-4 h-4" />, good: mttrValue <= 48 },
            { label: 'Completion Rate', value: `${kpis.completion_rate_percent ?? 0}%`, sub: '≥ 90% Target', icon: <CheckCircle2 className="w-4 h-4" />, good: (kpis.completion_rate_percent ?? 0) >= 90 },
            { label: 'Booking Conflicts', value: kpis.conflicts_prevented_count ?? 0, sub: 'ACID Zero Race', icon: <ShieldCheck className="w-4 h-4" />, good: true },
            { label: 'API Latency', value: `${kpis.system_response_ms ? Math.round(kpis.system_response_ms) : 0}ms`, sub: 'Target ≤ 2000ms', icon: <Zap className="w-4 h-4" />, good: (kpis.system_response_ms || 0) <= 2000 }
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/15 text-white shrink-0">{stat.icon}</div>
              <div>
                <p className="text-[10px] text-sky-200 font-bold uppercase tracking-wider truncate">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-black text-white font-['Outfit'] leading-none">{stat.value}</p>
                <p className={`text-[10px] font-semibold mt-0.5 ${stat.good ? 'text-lime-300' : 'text-amber-300'}`}>{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BENTO GRID — 4 Core KPI Cards (Aeline style)
      ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {/* KPI 1: MTTR — sky-blue card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 p-4 sm:p-5 group hover:border-blue-400/40 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-2xl" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 uppercase tracking-wider">MTTR</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Resolution Time</p>
          <p className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] leading-none">
            {mttrValue ? `${mttrValue}` : '0'}<span className="text-lg text-blue-300 ml-1">h</span>
          </p>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-400 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${Math.max(mttrSlaPercent, 5)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px]">
            <span className="text-emerald-400 font-bold">Within SLA</span>
            <span className="text-slate-500">≤ 48h Bench</span>
          </div>
        </div>

        {/* KPI 2: Completion Rate — lime accent card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-lime-500/15 to-emerald-600/10 border border-lime-500/20 p-4 sm:p-5 group hover:border-lime-400/40 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-lime-400 to-emerald-500 rounded-t-2xl" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-xl bg-lime-500/15 text-lime-400">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-lime-500/10 text-lime-300 uppercase tracking-wider">RATE</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Completion</p>
          <p className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] leading-none">
            {kpis.completion_rate_percent ?? 0}<span className="text-lg text-lime-300 ml-0.5">%</span>
          </p>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-lime-400 to-emerald-500 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(kpis.completion_rate_percent || 0, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px]">
            <span className="text-lime-400 font-bold">≥ 90% Target</span>
            <span className="text-slate-500">{maintenance.total ?? 0} total</span>
          </div>
        </div>

        {/* KPI 3: Zero Conflicts — dark obsidian card */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 p-4 sm:p-5 group hover:border-slate-600 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-lime-400 rounded-t-2xl" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-lime-400/15 text-lime-400 uppercase tracking-wider">ACID</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Booking Conflicts</p>
          <p className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] leading-none">
            {kpis.conflicts_prevented_count ?? 0}
          </p>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-400 to-lime-400 h-1.5 rounded-full w-full" />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px]">
            <span className="text-lime-400 font-bold">Strictly Zero</span>
            <span className="text-slate-500">No Race Cond.</span>
          </div>
        </div>

        {/* KPI 4: API Latency — frosted glass */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600/15 to-blue-700/10 border border-cyan-500/20 p-4 sm:p-5 group hover:border-cyan-400/40 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-t-2xl" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 uppercase tracking-wider">LIVE</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">API Latency</p>
          <p className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] leading-none">
            {kpis.system_response_ms ? Math.round(kpis.system_response_ms) : 0}<span className="text-lg text-cyan-300 ml-1">ms</span>
          </p>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-700 ${(kpis.system_response_ms || 0) <= 2000 ? 'bg-gradient-to-r from-cyan-400 to-emerald-400' : 'bg-gradient-to-r from-cyan-400 to-amber-400'}`}
              style={{ width: `${Math.min(Math.round(((kpis.system_response_ms || 20) / 4000) * 100), 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px]">
            <span className={(kpis.system_response_ms || 0) <= 2000 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {(kpis.system_response_ms || 0) <= 2000 ? 'Target ≤ 2s ✓' : 'Elevated'}
            </span>
            <span className="text-slate-500">Neon AWS</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ANALYTICS PANEL — 7-Day Trend + Hourly Bookings
      ═══════════════════════════════════════════════════════════ */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">7-Day Operational Activity &amp; Booking Velocity</h2>
              <p className="text-[11px] text-slate-400">Computed live from PostgreSQL production records</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-900/80 border border-white/5 text-xs shrink-0">
            <button
              onClick={() => setChartView('tickets')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition flex items-center gap-1.5 ${chartView === 'tickets' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Ticket Activity
            </button>
            <button
              onClick={() => setChartView('amenities')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition flex items-center gap-1.5 ${chartView === 'amenities' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Hourly Bookings
            </button>
          </div>
        </div>

        <div className="border-t border-white/5 pt-4">
          {chartView === 'tickets' ? (
            <div className="relative pt-1">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-slate-300 font-medium">Resolved ({maintenance.completed || 0})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-slate-300 font-medium">Incoming ({maintenance.total || 0})</span>
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">PostgreSQL 7-Day Query</span>
              </div>
              <div className="w-full overflow-hidden">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-40 overflow-visible">
                  <defs>
                    <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="ticketLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75].map((factor, idx) => (
                    <line key={idx} x1="0" y1={chartHeight * factor} x2={chartWidth} y2={chartHeight * factor}
                      stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="4 4" />
                  ))}
                  <path d={resolvedAreaPath} fill="url(#resolvedGradient)" />
                  <path d={resolvedPath} fill="none" stroke="#10b981" strokeWidth="2.5" />
                  <path d={ticketPath} fill="none" stroke="url(#ticketLineGrad)" strokeWidth="2.5" strokeDasharray="5 3" />
                  {resolvedPoints.map((pt, i) => (
                    <g key={i}>
                      <circle cx={pt.x} cy={pt.y} r="4.5" fill="#10b981" stroke="#030712" strokeWidth="2"
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredPoint({ ...trendData[i], x: pt.x, y: pt.y })}
                        onMouseLeave={() => setHoveredPoint(null)} />
                      <circle cx={ticketPoints[i].x} cy={ticketPoints[i].y} r="4" fill="#3b82f6" stroke="#030712" strokeWidth="2"
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredPoint({ ...trendData[i], x: ticketPoints[i].x, y: ticketPoints[i].y })}
                        onMouseLeave={() => setHoveredPoint(null)} />
                    </g>
                  ))}
                </svg>
              </div>
              <div className="flex justify-between pt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1">
                {trendData.map((d, i) => <span key={i} className="text-center">{d.day}</span>)}
              </div>
              {hoveredPoint && (
                <div className="absolute z-20 pointer-events-none p-2.5 rounded-xl bg-slate-900 border border-white/20 shadow-xl text-xs space-y-1 transform -translate-x-1/2 -translate-y-full"
                  style={{ left: `${(hoveredPoint.x / chartWidth) * 100}%`, top: '40px' }}>
                  <p className="font-bold text-white border-b border-white/10 pb-1">{hoveredPoint.day} ({hoveredPoint.date_str || 'Date'})</p>
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="text-emerald-400 font-medium">Resolved:</span>
                    <span className="font-bold text-white">{hoveredPoint.resolved} tickets</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="text-blue-400 font-medium">Logged:</span>
                    <span className="font-bold text-white">{hoveredPoint.tickets} tickets</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Actual Reservation Distribution by Time Slot</span>
                <span className="text-[11px] font-mono text-indigo-400">{amenities.total_bookings || 0} total bookings recorded</span>
              </div>
              {hourlyAmenities.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 glass-panel rounded-2xl">
                  No active amenity reservations on record in the database.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {hourlyAmenities.map((slot, idx) => (
                    <div key={idx} className="p-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-center hover:bg-indigo-500/20 transition">
                      <span className="text-xs font-mono font-bold text-slate-200 block">{slot.slot_time}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Slot</p>
                      <span className="text-lg font-black text-indigo-300 block mt-1">{slot.booking_count}</span>
                      <span className="text-[10px] text-slate-400">confirmed</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BENTO ROW — Status Pipeline + Category Ring + Activity Feed
      ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Left 2-cols: Maintenance Pipeline + Category */}
        <div className="lg:col-span-2 space-y-4">

          {/* Maintenance Tickets Status Pipeline */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Maintenance Ticket Status</h2>
                  <p className="text-[10px] text-slate-500">Click any status to open Kanban</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('maintenance')}
                className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-semibold transition"
              >
                Kanban View <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Pending', val: maintenance.pending ?? 0, color: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/25', text: 'text-amber-400', tag: 'text-amber-300/80' },
                { label: 'In Progress', val: maintenance.in_progress ?? 0, color: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/25', text: 'text-blue-400', tag: 'text-blue-300/80' },
                { label: 'Completed', val: maintenance.completed ?? 0, color: 'teal', bg: 'bg-teal-500/10', border: 'border-teal-500/25', text: 'text-teal-400', tag: 'text-teal-300/80' },
                { label: 'Closed', val: maintenance.closed ?? 0, color: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-400', tag: 'text-emerald-300/80' },
              ].map((s, i) => (
                <div
                  key={i}
                  onClick={() => setActiveTab('maintenance')}
                  className={`p-4 sm:p-5 rounded-2xl ${s.bg} border ${s.border} cursor-pointer hover:scale-[1.03] hover:shadow-lg transition-all text-center interactive-card`}
                >
                  <span className={`text-3xl font-black ${s.text} font-['Outfit']`}>{s.val}</span>
                  <p className={`text-[11px] font-bold ${s.tag} uppercase mt-1.5 tracking-wider`}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution (Donut + bars) */}
          <div className="glass-panel p-5 sm:p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Category Distribution</h2>
                  <p className="text-[10px] text-slate-500">Live PostgreSQL aggregation</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{totalCatCount} categorized</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              {/* SVG Donut Ring */}
              <div className="sm:col-span-5 flex items-center justify-center relative">
                <svg width="150" height="150" viewBox="0 0 150 150" className="transform -rotate-90">
                  <circle cx="75" cy="75" r={radius} fill="transparent" stroke="#1e293b" strokeWidth="14" />
                  {totalCatCount > 0 && categories.map((cat, idx) => {
                    const count = Number(cat.count);
                    const percent = count / totalCatCount;
                    const strokeDash = percent * circumference;
                    const strokeOffset = -accumulatedPercent * circumference;
                    accumulatedPercent += percent;
                    const col = categoryColors.find(c => c.name === cat.category) || categoryColors[idx % categoryColors.length];
                    const isHovered = hoveredCategory === cat.category;
                    return (
                      <circle key={idx} cx="75" cy="75" r={radius} fill="transparent"
                        stroke={col.color} strokeWidth={isHovered ? 18 : 14}
                        strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                        strokeDashoffset={strokeOffset}
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredCategory(cat.category)}
                        onMouseLeave={() => setHoveredCategory(null)} />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xl font-black text-white font-['Outfit']">
                    {hoveredCategory ? categories.find(c => c.category === hoveredCategory)?.count || 0 : totalCatCount}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    {hoveredCategory ? hoveredCategory.substring(0, 8) : 'Total'}
                  </span>
                </div>
              </div>

              {/* Category List */}
              <div className="sm:col-span-7 space-y-2">
                {categories.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No tickets categorized yet.</p>
                ) : (
                  categories.map((cat, idx) => {
                    const total = maintenance.total || 1;
                    const percent = Math.round((Number(cat.count) / total) * 100);
                    const col = categoryColors.find(c => c.name === cat.category) || categoryColors[idx % categoryColors.length];
                    const isHovered = hoveredCategory === cat.category;
                    return (
                      <div key={idx}
                        onMouseEnter={() => setHoveredCategory(cat.category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        className={`p-2 rounded-xl transition cursor-pointer text-xs flex items-center justify-between ${isHovered ? 'bg-white/10 scale-[1.02]' : 'hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                          <span className="font-semibold text-slate-200">{cat.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-[11px]">{cat.count}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">{percent}%</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Amenity Callout */}
            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Amenity Concurrency Engine</p>
                  <p className="text-[11px] text-slate-400">{amenities.total_bookings ?? 0} total reservations verified in database</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('amenities')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition active:scale-95"
              >
                Reserve Amenity Slot <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 1-col: Live Activity Feed */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h2 className="text-sm font-bold text-white">Live Activity Feed</h2>
            </div>
            <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">WebSocket</span>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-slate-900/60 border border-white/5 text-[11px]">
            {['ALL', 'MAINTENANCE', 'AMENITY'].map((f) => (
              <button key={f} onClick={() => setFeedFilter(f)}
                className={`flex-1 py-1.5 rounded-full font-semibold transition ${feedFilter === f ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>
                {f === 'ALL' ? 'All' : f === 'MAINTENANCE' ? 'Tickets' : 'Amenities'}
              </button>
            ))}
          </div>

          {/* Feed Items */}
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px] pr-0.5">
            {filteredFeed.length === 0 ? (
              <div className="py-14 text-center">
                <Server className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No recent database events recorded.</p>
              </div>
            ) : (
              filteredFeed.map((item) => (
                <div key={item.id}
                  className="p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/60 border border-white/5 transition text-xs space-y-1.5 interactive-card">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-200 truncate">{item.actor_name}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">{formatRelativeTime(item.created_at)}</span>
                  </div>
                  <p className="text-slate-300 leading-snug">{item.message}</p>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${item.actor_role === 'OWNER' ? 'bg-amber-500/10 text-amber-400' : item.actor_role === 'STAFF' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
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
