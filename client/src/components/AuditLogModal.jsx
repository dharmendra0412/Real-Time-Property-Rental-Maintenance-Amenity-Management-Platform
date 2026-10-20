import React from 'react';
import {
  Clock,
  User,
  Wrench,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldAlert
} from 'lucide-react';

export default function AuditLogModal({
  isOpen,
  ticket,
  onClose
}) {
  if (!isOpen || !ticket) return null;

  const logs = ticket.logs || [];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg glass-panel rounded-2xl p-6 shadow-2xl border border-white/10 space-y-5 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-blue-400 font-bold">#{ticket.id.slice(-6)}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300">
                AUDIT TRAIL
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">{ticket.title}</h3>
            <p className="text-xs text-slate-400">
              Unit: <span className="text-slate-200">{ticket.unit_number || 'General'}</span> • {ticket.property_name || 'Skyline'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Lifecycle State History
          </p>

          {logs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No change logs recorded for this ticket.
            </div>
          ) : (
            <div className="relative border-l border-white/10 ml-3.5 space-y-5 py-1">
              {logs.map((log, index) => (
                <div key={log.id || index} className="relative pl-6 group">
                  {/* Timeline Dot */}
                  <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-slate-950 group-hover:scale-125 transition-transform" />

                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">
                        {log.action_note || 'Status updated'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <User className="w-3 h-3 text-blue-400" />
                        {log.actor_name || 'System Operator'}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {new Date(log.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Ticket created: {new Date(ticket.created_at).toLocaleDateString()}</span>
          <span className="font-semibold text-emerald-400">Immutable Audit Record</span>
        </div>
      </div>
    </div>
  );
}
