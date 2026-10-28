import React, { useState } from 'react';
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
  Menu,
  X,
  SlidersHorizontal,
  Bell
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
  onOpenCommandPalette,
  onExportReport
}) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'properties', label: 'Properties', icon: Building2 },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'amenities', label: 'Amenities', icon: Sparkles }
  ];

  const getRoleBadge = (role) => {
    switch (role) {
      case 'OWNER':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0 whitespace-nowrap">OWNER</span>;
      case 'STAFF':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shrink-0 whitespace-nowrap">FACILITIES</span>;
      case 'TENANT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 whitespace-nowrap">TENANT</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/85 backdrop-blur-xl">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-6 shrink-0">
            <div
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0"
              onClick={() => {
                setActiveTab('dashboard');
                setMobileDrawerOpen(false);
              }}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20 shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="shrink-0">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-white font-['Outfit']">SKYLINE</span>
                  <span className="hidden sm:inline px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">ENTERPRISE</span>
                </div>
                <p className="hidden md:block text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-wide whitespace-nowrap">Rental • Maintenance • Amenities</p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden lg:flex items-center p-1 rounded-xl bg-slate-900/80 border border-white/5 shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
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
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Search / Command Palette Trigger */}
            <button
              onClick={onOpenCommandPalette}
              title="Command Palette (Ctrl + K)"
              className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 text-xs text-slate-400 hover:text-white transition shadow-sm shrink-0 whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <kbd className="hidden sm:inline px-1.5 py-0.2 rounded bg-slate-800 text-[9px] font-bold text-slate-400 border border-white/5">
                ⌘K
              </kbd>
            </button>

            {/* Desktop Live Status Indicator */}
            <div className="hidden md:flex items-center shrink-0">
              {liveConnected ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse glow-dot-emerald shrink-0" />
                  <span>LIVE SYNC</span>
                </div>
              ) : cloudOnline ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-semibold whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 glow-dot-blue shrink-0" />
                  <span>CLOUD ONLINE</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-semibold whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>OFFLINE</span>
                </div>
              )}
            </div>

            {/* Mobile Compact Live Dot */}
            <div className="md:hidden flex items-center justify-center p-1.5 rounded-lg bg-slate-900/60 border border-white/5">
              <span
                className={`w-2 h-2 rounded-full ${
                  liveConnected
                    ? 'bg-emerald-400 animate-pulse glow-dot-emerald'
                    : cloudOnline
                    ? 'bg-cyan-400 glow-dot-blue'
                    : 'bg-rose-500'
                }`}
                title={liveConnected ? 'WebSocket Live Sync' : cloudOnline ? 'Cloud DB Online' : 'Offline'}
              />
            </div>

            {/* Desktop Export Report Button */}
            <button
              onClick={onExportReport}
              title="Export Operational Audit Snapshot (JSON)"
              className="hidden sm:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 transition shrink-0"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Desktop Sound Toggle Button */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Audio alerts enabled' : 'Audio muted'}
              className="hidden sm:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 transition shrink-0"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {/* User Profile or Login */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 p-1 pl-1.5 rounded-xl bg-slate-900/80 border border-white/5 shrink-0 whitespace-nowrap">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white uppercase shrink-0">
                    {currentUser.full_name ? currentUser.full_name[0] : 'U'}
                  </div>
                  <span className="hidden xl:inline text-xs font-bold text-white max-w-[100px] truncate shrink-0">
                    {currentUser.full_name.split(' ')[0]}
                  </span>
                  <span className="hidden sm:inline">
                    {getRoleBadge(currentUser.role)}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="hidden sm:block p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Sign In</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            )}

            {/* Mobile Overflow Menu Toggle */}
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              title="More Options"
              className="sm:hidden p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 text-slate-400 hover:text-white transition shrink-0"
            >
              {mobileDrawerOpen ? <X className="w-4 h-4 text-slate-200" /> : <Menu className="w-4 h-4 text-slate-200" />}
            </button>
          </div>
        </div>

        {/* Mobile Action Sheet Drawer */}
        {mobileDrawerOpen && (
          <div className="sm:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl p-4 space-y-4 animate-slide-up shadow-2xl">
            {/* User Profile Card on Mobile */}
            {currentUser ? (
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white uppercase">
                    {currentUser.full_name ? currentUser.full_name[0] : 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{currentUser.full_name}</p>
                    <p className="text-[10px] text-slate-400">{currentUser.email}</p>
                    <div className="mt-1">{getRoleBadge(currentUser.role)}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileDrawerOpen(false);
                  }}
                  className="p-2 rounded-xl text-rose-400 bg-rose-500/10 border border-rose-500/20 text-xs font-bold flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileDrawerOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-slate-200 text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileDrawerOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 text-xs font-bold text-white text-center shadow-md shadow-blue-600/30"
                >
                  Register
                </button>
              </div>
            )}

            {/* Utility Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs font-semibold text-slate-300"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                <span>{soundEnabled ? 'Audio On' : 'Muted'}</span>
              </button>
              <button
                onClick={() => {
                  onExportReport();
                  setMobileDrawerOpen(false);
                }}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs font-semibold text-slate-300"
              >
                <FileDown className="w-4 h-4 text-blue-400" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Modern Fixed Bottom Navigation Bar for Mobile View */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 px-2 pt-1.5 pb-2 safe-area-bottom flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileDrawerOpen(false);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 px-1 rounded-xl text-[10px] font-bold transition-all duration-200 ${
                isActive
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform ${isActive ? 'text-blue-400 scale-110' : 'text-slate-400'}`} />
              <span className="truncate max-w-[65px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
