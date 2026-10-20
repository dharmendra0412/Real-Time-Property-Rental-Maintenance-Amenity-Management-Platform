import React, { useState, useEffect } from 'react';
import {
  Building2,
  LayoutDashboard,
  Wrench,
  Sparkles,
  Volume2,
  VolumeX,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  User,
  ChevronDown,
  Activity,
  Radio,
  Search,
  FileDown,
  Clock
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  liveConnected,
  cloudOnline,
  soundEnabled,
  setSoundEnabled,
  onOpenAuth,
  onLogout,
  onQuickLogin,
  onOpenCommandPalette,
  onExportReport
}) {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [timeStr, setTimeStr] = useState('');

  // Live ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'properties', label: 'Properties', icon: Building2 },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'amenities', label: 'Amenities', icon: Sparkles }
  ];

  const getRoleBadge = (role) => {
    switch (role) {
      case 'OWNER':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">OWNER</span>;
      case 'STAFF':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">FACILITIES</span>;
      case 'TENANT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">TENANT</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white font-['Outfit']">SKYLINE</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">ENTERPRISE</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">Rental • Maintenance • Amenities</p>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="hidden lg:flex items-center p-1 rounded-xl bg-slate-900/80 border border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-blue-600 shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Search / Command Palette Trigger (Ctrl + K) */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 text-xs text-slate-400 hover:text-white transition shadow-sm"
        >
          <Search className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px]">Command Palette...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400 border border-white/5">
            ⌘K
          </kbd>
        </button>

        {/* Right Controls: Live Badge, Clock, Sound, Role Switcher, Auth */}
        <div className="flex items-center gap-2">
          {/* Live System Time */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/50 border border-white/5 text-[11px] font-mono text-slate-400">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{timeStr}</span>
          </div>

          {/* Live WebSocket Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5">
            {liveConnected ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse glow-dot-emerald" />
                <span>LIVE SYNC</span>
              </div>
            ) : cloudOnline ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 glow-dot-blue" />
                <span>CLOUD ONLINE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>OFFLINE</span>
              </div>
            )}
          </div>

          {/* Export Report Button */}
          <button
            onClick={onExportReport}
            title="Export Operational Audit Snapshot (JSON)"
            className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 transition"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Audio alerts enabled' : 'Audio muted'}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 transition"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Quick Demo Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-blue-500/10 hover:from-indigo-500/20 hover:to-blue-500/20 border border-indigo-500/25 text-indigo-300 text-xs font-semibold transition"
            >
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Quick Demo Roles</span>
              <ChevronDown className="w-3 h-3 text-indigo-400" />
            </button>

            {showPersonaMenu && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel p-2 shadow-2xl z-50 animate-slide-up"
                onMouseLeave={() => setShowPersonaMenu(false)}
              >
                <div className="px-3 py-1.5 border-b border-white/5 mb-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Switch Test Persona</p>
                  <p className="text-[10px] text-slate-500">1-click login without password entry</p>
                </div>
                <button
                  onClick={() => {
                    onQuickLogin('dharmesh.owner@realestate.com', 'securepassword123');
                    setShowPersonaMenu(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 text-left text-xs transition group"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="font-semibold text-white group-hover:text-amber-300 transition">Property Owner</p>
                      <p className="text-[10px] text-slate-400">Dharmesh Sharma</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400">OWNER</span>
                </button>
                <button
                  onClick={() => {
                    onQuickLogin('rahul.verma@gmail.com', 'securepassword123');
                    setShowPersonaMenu(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 text-left text-xs transition group"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="font-semibold text-white group-hover:text-emerald-300 transition">Resident Tenant</p>
                      <p className="text-[10px] text-slate-400">Rahul Verma (Tower A - 402)</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400">TENANT</span>
                </button>
                <button
                  onClick={() => {
                    onQuickLogin('suresh.tech@services.com', 'securepassword123');
                    setShowPersonaMenu(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 text-left text-xs transition group"
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="font-semibold text-white group-hover:text-cyan-300 transition">Facilities Staff</p>
                      <p className="text-[10px] text-slate-400">Suresh Kumar (Tech)</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-cyan-400">STAFF</span>
                </button>
              </div>
            )}
          </div>

          {/* User Profile or Login */}
          {currentUser ? (
            <div className="flex items-center gap-2 p-1 pl-2.5 rounded-xl bg-slate-900/80 border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white uppercase">
                  {currentUser.full_name ? currentUser.full_name[0] : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-white leading-tight truncate max-w-[110px]">{currentUser.full_name}</p>
                </div>
                {getRoleBadge(currentUser.role)}
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Tabs */}
      <div className="lg:hidden flex items-center justify-around border-t border-white/5 p-2 bg-slate-950">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-semibold transition ${
                isActive ? 'text-blue-400' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
