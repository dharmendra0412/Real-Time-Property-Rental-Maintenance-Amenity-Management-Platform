import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  Shield,
  User,
  Wrench,
  X,
  Lock,
  Mail,
  Phone,
  Building2
} from 'lucide-react';

export default function AuthModal({
  isOpen,
  initialMode = 'login',
  onClose,
  onLogin,
  onRegister,
  onQuickDemo
}) {
  const [mode, setMode] = useState(initialMode);
  const [selectedRole, setSelectedRole] = useState('TENANT');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 border border-white/10 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 blur-sm" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white font-['Outfit']">
              {mode === 'login' ? 'Welcome Back' : 'Create Skyline Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'login'
                ? 'Sign in to access your property dashboard and operations.'
                : 'Join the platform as a resident tenant, owner, or staff.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex p-1 rounded-xl bg-slate-900/80 border border-white/5">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'login' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'register' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Quick Demo Credentials Box */}
        {mode === 'login' && (
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Instant 1-Click Demo Login
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => onQuickDemo('dharmesh.owner@realestate.com', 'securepassword123')}
                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-center transition group"
              >
                <Shield className="w-4 h-4 text-amber-400 mx-auto mb-1 group-hover:scale-110 transition" />
                <span className="block text-[10px] font-bold text-amber-300">Owner</span>
              </button>
              <button
                type="button"
                onClick={() => onQuickDemo('rahul.verma@gmail.com', 'securepassword123')}
                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-center transition group"
              >
                <User className="w-4 h-4 text-emerald-400 mx-auto mb-1 group-hover:scale-110 transition" />
                <span className="block text-[10px] font-bold text-emerald-300">Tenant</span>
              </button>
              <button
                type="button"
                onClick={() => onQuickDemo('suresh.tech@services.com', 'securepassword123')}
                className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-center transition group"
              >
                <Wrench className="w-4 h-4 text-cyan-400 mx-auto mb-1 group-hover:scale-110 transition" />
                <span className="block text-[10px] font-bold text-cyan-300">Staff</span>
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target;
            if (mode === 'login') {
              onLogin(form.email.value.trim(), form.password.value);
            } else {
              onRegister({
                full_name: form.full_name.value.trim(),
                email: form.email.value.trim(),
                password: form.password.value,
                role: selectedRole,
                phone: form.phone ? form.phone.value.trim() : ''
              });
            }
          }}
          className="space-y-3.5 text-xs"
        >
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Account Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'TENANT', label: 'Tenant' },
                    { id: 'OWNER', label: 'Owner' },
                    { id: 'STAFF', label: 'Staff' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      className={`py-1.5 rounded-xl font-bold transition text-xs ${
                        selectedRole === r.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Legal Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    name="full_name"
                    required
                    placeholder="e.g. John Doe"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    name="phone"
                    placeholder="+91-9876543210"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                name="email"
                type="email"
                required
                placeholder="name@example.com"
                className="w-full pl-8 pr-3 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••••••"
                className="w-full pl-8 pr-3 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-lg shadow-blue-600/30 transition text-xs mt-2"
          >
            {mode === 'login' ? 'Sign In to Platform' : 'Create Skyline Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
