import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutDashboard,
  Building2,
  Wrench,
  Sparkles,
  Shield,
  User,
  Plus,
  ArrowRight,
  X,
  FileDown
} from 'lucide-react';

export default function CommandPalette({
  isOpen,
  onClose,
  setActiveTab,
  onQuickLogin,
  onOpenNewTicket,
  onExportReport
}) {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      category: 'Navigation',
      items: [
        {
          id: 'nav-overview',
          label: 'Go to Operational Overview',
          desc: 'View live KPIs, MTTR, and real-time feed',
          icon: LayoutDashboard,
          action: () => { setActiveTab('dashboard'); onClose(); }
        },
        {
          id: 'nav-properties',
          label: 'Go to Properties & Units',
          desc: 'Manage physical towers, flats, and leases',
          icon: Building2,
          action: () => { setActiveTab('properties'); onClose(); }
        },
        {
          id: 'nav-maintenance',
          label: 'Go to Maintenance Ticketing',
          desc: 'Inspect tickets, assignments, and CSAT reviews',
          icon: Wrench,
          action: () => { setActiveTab('maintenance'); onClose(); }
        },
        {
          id: 'nav-amenities',
          label: 'Go to Amenities Hub',
          desc: 'Reserve badminton court, pool, and gym slots',
          icon: Sparkles,
          action: () => { setActiveTab('amenities'); onClose(); }
        }
      ]
    },
    {
      category: 'Quick Role Switching',
      items: [
        {
          id: 'role-owner',
          label: 'Switch to Property Owner (Dharmesh Sharma)',
          desc: 'Full administrator privileges and property creation',
          icon: Shield,
          color: 'text-amber-400',
          action: () => { onQuickLogin('dharmesh.owner@realestate.com', 'securepassword123'); onClose(); }
        },
        {
          id: 'role-tenant',
          label: 'Switch to Resident Tenant (Rahul Verma)',
          desc: 'Lease holder in Tower A - 402 with booking access',
          icon: User,
          color: 'text-emerald-400',
          action: () => { onQuickLogin('rahul.verma@gmail.com', 'securepassword123'); onClose(); }
        },
        {
          id: 'role-staff',
          label: 'Switch to Facilities Staff (Suresh Kumar)',
          desc: 'Technician portal to complete and resolve tickets',
          icon: Wrench,
          color: 'text-cyan-400',
          action: () => { onQuickLogin('suresh.tech@services.com', 'securepassword123'); onClose(); }
        }
      ]
    },
    {
      category: 'Fast Actions',
      items: [
        {
          id: 'act-ticket',
          label: 'Report New Maintenance Issue',
          desc: 'Submit photo attachment and dispatch to staff',
          icon: Plus,
          action: () => { onOpenNewTicket(); onClose(); }
        },
        {
          id: 'act-export',
          label: 'Export Operational Audit Report (JSON)',
          desc: 'Download audited system KPIs and logs snapshot',
          icon: FileDown,
          action: () => { onExportReport(); onClose(); }
        }
      ]
    }
  ];

  const filteredCategories = actions
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) =>
        query === '' ||
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.desc.toLowerCase().includes(query.toLowerCase())
      )
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl glass-panel rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[75vh]"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-slate-900/60">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or jump to page... (e.g. 'tenant', 'maintenance', 'kpi')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-white/5"
          >
            ESC
          </button>
        </div>

        {/* Command List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {filteredCategories.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No matching commands or actions found.
            </div>
          ) : (
            filteredCategories.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {cat.category}
                </p>
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition text-left text-xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-slate-900/80 border border-white/5 group-hover:bg-blue-600/10 group-hover:border-blue-500/20 transition">
                          <Icon className={`w-4 h-4 ${item.color || 'text-slate-300 group-hover:text-blue-400'} transition`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 group-hover:text-white truncate">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{item.desc}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-white/5 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Skyline Command Center</span>
          <div className="flex items-center gap-2">
            <span>Navigation: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">↑↓</kbd></span>
            <span>Select: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">↵</kbd></span>
          </div>
        </div>
      </div>
    </div>
  );
}
