import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  Building2,
  Wrench,
  CalendarCheck,
  LayoutDashboard,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Activity,
  Plus,
  LogOut,
  LogIn,
  UserPlus,
  Star,
  Users,
  DoorOpen,
  Calendar,
  Lock,
  ChevronRight,
  Eye,
  AlertTriangle,
  RefreshCw,
  X,
  FileText
} from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { API } from './api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userContext, setUserContext] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  const [liveConnected, setLiveConnected] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Dashboard Stats State
  const [stats, setStats] = useState(null);

  // Properties State
  const [properties, setProperties] = useState([]);
  const [selectedPropertyDetails, setSelectedPropertyDetails] = useState(null);

  // Maintenance State
  const [tickets, setTickets] = useState([]);
  const [maintenanceFilters, setMaintenanceFilters] = useState({ status: 'ALL', priority: 'ALL', category: 'ALL' });
  const [staffUsers, setStaffUsers] = useState([]);

  // Amenities State
  const [amenities, setAmenities] = useState([]);
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotsData, setSlotsData] = useState(null);
  const [myBookings, setMyBookings] = useState([]);

  // Modals State
  const [modalType, setModalType] = useState(null); // 'login', 'register', 'addProperty', 'addUnit', 'addAmenity', 'newTicket', 'assignTech', 'completeTicket', 'rateTicket', 'ticketDetails', 'bookSlot'
  const [modalData, setModalData] = useState({});
  const [ratingStars, setRatingStars] = useState(5);

  // Audio chime feedback
  const playChime = (f1 = 520, f2 = 660) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(f1, now);
      osc2.frequency.setValueAtTime(f2, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.08);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {}
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // 1. Initial Auth & Socket Connection
  useEffect(() => {
    // Check existing auth
    const token = API.getToken();
    if (token) {
      API.getMe()
        .then(res => {
          setCurrentUser(res.user);
          setUserContext(res.context || {});
        })
        .catch(() => {
          API.logout();
          setCurrentUser(null);
        });
    }

    // Connect WebSocket
    const socket = io();

    socket.on('connect', () => {
      setLiveConnected(true);
    });

    socket.on('disconnect', () => {
      setLiveConnected(false);
    });

    // Real-time Event listeners
    socket.on('maintenance:created', data => {
      playChime(520, 660);
      addToast(`New ticket reported: "${data.title}" (${data.priority})`, 'info');
      refreshAll();
    });

    socket.on('maintenance:updated', data => {
      playChime(660, 880);
      addToast(`Ticket #${data.id.slice(-4)} status updated to ${data.status}`, 'success');
      refreshAll();
    });

    socket.on('maintenance:rated', data => {
      playChime(700, 900);
      addToast(`Tenant rated Ticket #${data.id.slice(-4)}: ${data.satisfaction_rating} ★`, 'success');
      refreshAll();
    });

    socket.on('amenity:booked', data => {
      playChime(440, 550);
      addToast(`Slot reserved for ${data.amenity_name} (${data.start_time} - ${data.end_time})`, 'info');
      refreshAll();
    });

    socket.on('amenity:checked_in', data => {
      addToast(`Checked in to ${data.amenity_name}`, 'success');
      refreshAll();
    });

    socket.on('amenity:checked_out', data => {
      addToast(`Checked out of ${data.amenity_name}`, 'success');
      refreshAll();
    });

    socket.on('amenity:cancelled', data => {
      addToast(`Reservation cancelled for ${data.amenity_name} - Slot released`, 'info');
      refreshAll();
    });

    return () => socket.disconnect();
  }, []);

  // 2. Fetch Data when Active Tab or User changes
  const refreshAll = () => {
    loadDashboardStats();
    if (activeTab === 'properties') loadProperties();
    if (activeTab === 'maintenance') loadMaintenance();
    if (activeTab === 'amenities') {
      loadAmenities();
      if (selectedAmenity) loadSlots(selectedAmenity.id, selectedDate);
      loadMyBookings();
    }
  };

  useEffect(() => {
    refreshAll();
    if (currentUser) {
      API.getUsers('STAFF').then(setStaffUsers).catch(() => setStaffUsers([]));
    }
  }, [activeTab, currentUser]);

  const loadDashboardStats = () => {
    API.getStats().then(setStats).catch(() => {});
  };

  const loadProperties = async () => {
    if (!currentUser) return;
    try {
      const data = await API.getProperties();
      setProperties(data || []);
      if (data && data.length > 0 && !selectedPropertyDetails) {
        const details = await API.getProperty(data[0].id);
        setSelectedPropertyDetails(details);
      }
    } catch {}
  };

  const loadMaintenance = () => {
    if (!currentUser) return;
    API.getMaintenanceRequests(maintenanceFilters)
      .then(setTickets)
      .catch(() => setTickets([]));
  };

  const loadAmenities = async () => {
    try {
      const data = await API.getAmenities();
      setAmenities(data || []);
      if (data && data.length > 0 && !selectedAmenity) {
        setSelectedAmenity(data[0]);
        loadSlots(data[0].id, selectedDate);
      }
    } catch {}
  };

  const loadSlots = (amenityId, date) => {
    API.getAmenityAvailability(amenityId, date)
      .then(setSlotsData)
      .catch(() => setSlotsData(null));
  };

  const loadMyBookings = () => {
    if (!currentUser) return;
    API.getMyBookings()
      .then(setMyBookings)
      .catch(() => setMyBookings([]));
  };

  // Auth Actions
  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    try {
      const res = await API.login(email, password);
      setCurrentUser(res.user);
      const me = await API.getMe();
      setUserContext(me.context || {});
      setModalType(null);
      addToast(`Welcome back, ${res.user.full_name}!`, 'success');
      refreshAll();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const payload = {
      full_name: e.target.full_name.value.trim(),
      email: e.target.email.value.trim(),
      password: e.target.password.value,
      phone: e.target.phone.value.trim(),
      role: e.target.role.value,
      unit_id: e.target.unit_id?.value || null
    };
    try {
      const res = await API.register(payload);
      setCurrentUser(res.user);
      const me = await API.getMe();
      setUserContext(me.context || {});
      setModalType(null);
      addToast(`Account registered as ${res.user.role}!`, 'success');
      refreshAll();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleLogout = () => {
    API.logout();
    setCurrentUser(null);
    setUserContext({});
    addToast('Signed out successfully.', 'info');
    refreshAll();
  };

  // Property Actions
  const handleAddProperty = async (e) => {
    e.preventDefault();
    try {
      await API.createProperty({
        name: e.target.name.value.trim(),
        address: e.target.address.value.trim(),
        city: e.target.city.value.trim(),
        state: e.target.state.value.trim(),
        zip_code: e.target.zip_code.value.trim()
      });
      addToast('Property registered successfully!', 'success');
      setModalType(null);
      loadProperties();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();
    try {
      await API.createUnit(modalData.propertyId, {
        unit_number: e.target.unit_number.value.trim(),
        floor: e.target.floor.value
      });
      addToast('Unit added successfully!', 'success');
      setModalType(null);
      const updated = await API.getProperty(modalData.propertyId);
      setSelectedPropertyDetails(updated);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Amenity Actions
  const handleAddAmenity = async (e) => {
    e.preventDefault();
    try {
      await API.createAmenity({
        property_id: e.target.property_id.value,
        name: e.target.name.value.trim(),
        description: e.target.description.value.trim(),
        opening_time: e.target.opening_time.value,
        closing_time: e.target.closing_time.value,
        slot_duration_minutes: e.target.slot_duration_minutes.value,
        max_capacity: e.target.max_capacity.value,
        rules: e.target.rules.value.trim()
      });
      addToast('Amenity registered successfully!', 'success');
      setModalType(null);
      loadAmenities();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleBookSlot = async (e) => {
    e.preventDefault();
    try {
      await API.bookAmenity({
        amenity_id: modalData.amenityId,
        booking_date: modalData.date,
        start_time: modalData.startTime,
        end_time: modalData.endTime,
        attendees_count: e.target.attendees_count.value,
        notes: e.target.notes.value.trim()
      });
      addToast('Slot reserved successfully! Zero conflict guaranteed.', 'success');
      setModalType(null);
      loadSlots(modalData.amenityId, modalData.date);
      loadMyBookings();
    } catch (err) {
      addToast(`Conflict: ${err.message}`, 'error');
    }
  };

  // Maintenance Actions
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await API.createMaintenanceRequest(formData);
      addToast('Maintenance ticket reported successfully!', 'success');
      setModalType(null);
      loadMaintenance();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAssignTech = async (e) => {
    e.preventDefault();
    try {
      await API.updateTicketStatus(modalData.ticketId, {
        status: 'IN_PROGRESS',
        assigned_staff_id: e.target.assigned_staff_id.value,
        action_note: e.target.action_note.value.trim() || 'Assigned to technician'
      });
      addToast('Technician assigned successfully!', 'success');
      setModalType(null);
      loadMaintenance();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleCompleteTicket = async (e) => {
    e.preventDefault();
    try {
      await API.updateTicketStatus(modalData.ticketId, {
        status: 'COMPLETED',
        resolution_notes: e.target.resolution_notes.value.trim(),
        action_note: 'Repair completed by technician'
      });
      addToast('Ticket marked as COMPLETED!', 'success');
      setModalType(null);
      loadMaintenance();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleRateTicket = async (e) => {
    e.preventDefault();
    try {
      await API.rateTicket(modalData.ticketId, ratingStars, e.target.feedback.value.trim());
      addToast('Thank you for rating your service!', 'success');
      setModalType(null);
      loadMaintenance();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              SKYLINE PLATFORM
            </h1>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Rental, Maintenance & Amenities
            </p>
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-full border border-slate-800">
          {[
            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
            { id: 'properties', label: 'Properties', icon: Building2 },
            { id: 'maintenance', label: 'Maintenance', icon: Wrench },
            { id: 'amenities', label: 'Amenities', icon: CalendarCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <span className={`w-2 h-2 rounded-full ${liveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            {liveConnected ? 'LIVE SYNC' : 'OFFLINE'}
          </div>

          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">
                  {currentUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left text-xs leading-tight">
                  <div className="font-semibold text-slate-200">{currentUser.full_name}</div>
                  <span className="text-[10px] font-bold uppercase text-blue-400">{currentUser.role}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalType('login')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 transition"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
              <button
                onClick={() => setModalType('register')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition"
              >
                <UserPlus className="w-3.5 h-3.5" /> Register
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* 1. DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Real-Time Operational KPIs</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Live metrics strictly evaluated from actual database records (Zero Simulation).
                </p>
              </div>
              <button
                onClick={loadDashboardStats}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {/* 4 Core KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* KPI 1 */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
                <div className="h-1 bg-blue-500 absolute top-0 left-0 right-0" />
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <span>Resolution Time (MTTR)</span>
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-3xl font-black tracking-tight text-white">
                  {stats?.kpis?.mttr_hours !== null && stats?.kpis?.mttr_hours !== undefined
                    ? `${stats.kpis.mttr_hours}h`
                    : 'N/A'}
                </div>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">SLA ≤ 48h</span>
                  <span>Database average</span>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
                <div className="h-1 bg-emerald-500 absolute top-0 left-0 right-0" />
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <span>Completion Rate</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-black tracking-tight text-white">
                  {stats?.kpis?.completion_rate_percent ?? 0}%
                </div>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">Target ≥ 90%</span>
                  <span>Resolved tickets</span>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
                <div className="h-1 bg-amber-500 absolute top-0 left-0 right-0" />
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <span>Booking Conflicts</span>
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-black tracking-tight text-white">
                  {stats?.kpis?.conflicts_prevented_count ?? 0}
                </div>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">Strictly 0</span>
                  <span>ACID Transaction Lock</span>
                </div>
              </div>

              {/* KPI 4 */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
                <div className="h-1 bg-cyan-500 absolute top-0 left-0 right-0" />
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <span>API Response Latency</span>
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-3xl font-black tracking-tight text-white">
                  {stats?.kpis?.system_response_ms ?? 0}ms
                </div>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">Target ≤ 2.0s</span>
                  <span>High-speed engine</span>
                </div>
              </div>
            </div>

            {/* Status Grid & Live Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status Distribution */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
                <h3 className="text-base font-bold flex items-center gap-2 text-slate-200">
                  <Wrench className="w-4 h-4 text-blue-400" /> Maintenance Tickets Status Breakdown
                </h3>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="text-2xl font-black text-amber-400">{stats?.maintenance?.pending ?? 0}</div>
                    <div className="text-[11px] uppercase font-bold text-slate-400 mt-1">Pending</div>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <div className="text-2xl font-black text-blue-400">{stats?.maintenance?.in_progress ?? 0}</div>
                    <div className="text-[11px] uppercase font-bold text-slate-400 mt-1">In Progress</div>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-2xl font-black text-emerald-400">{stats?.maintenance?.completed ?? 0}</div>
                    <div className="text-[11px] uppercase font-bold text-slate-400 mt-1">Completed</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                    <div className="text-2xl font-black text-slate-400">{stats?.maintenance?.closed ?? 0}</div>
                    <div className="text-[11px] uppercase font-bold text-slate-400 mt-1">Closed</div>
                  </div>
                </div>

                {/* Priority Breakdown */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Tickets by Urgency</h4>
                  {stats?.maintenance?.by_priority && stats.maintenance.by_priority.length > 0 ? (
                    <div className="space-y-2">
                      {stats.maintenance.by_priority.map(p => {
                        const pct = stats.maintenance.total > 0 ? Math.round((p.count / stats.maintenance.total) * 100) : 0;
                        return (
                          <div key={p.priority} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span>{p.priority}</span>
                              <span className="font-bold">{p.count} ({pct}%)</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  p.priority === 'EMERGENCY' ? 'bg-rose-500' :
                                  p.priority === 'HIGH' ? 'bg-amber-500' :
                                  p.priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-slate-400'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No tickets logged yet.</p>
                  )}
                </div>
              </div>

              {/* Live Activity Stream */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold flex items-center gap-2 text-slate-200">
                    <Activity className="w-4 h-4 text-emerald-400" /> Real-Time Live Feed
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    WebSocket
                  </span>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {stats?.activity_feed && stats.activity_feed.length > 0 ? (
                    stats.activity_feed.map(item => (
                      <div key={item.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{item.subject_title || item.actor_name}</span>
                          <span className="text-[10px] text-slate-500">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-400">{item.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-8">No live activity recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PROPERTIES & UNITS */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Properties & Leased Units</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Manage physical residential buildings and assigned tenant leases.
                </p>
              </div>
              {currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && (
                <button
                  onClick={() => setModalType('addProperty')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition"
                >
                  <Plus className="w-4 h-4" /> Add Property
                </button>
              )}
            </div>

            {properties.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-slate-300">No Properties Registered Yet</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  {currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN')
                    ? 'Click "+ Add Property" above to register your first real residential building.'
                    : 'Sign in as a Property Owner to register real estate properties.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map(p => (
                  <div key={p.id} className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-blue-400" /> {p.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {p.address}, {p.city}, {p.state} {p.zip_code}
                        </p>
                      </div>
                      {currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && (
                        <button
                          onClick={() => {
                            setModalData({ propertyId: p.id });
                            setModalType('addUnit');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-800/60 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Unit
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                      <div>
                        <div className="font-bold text-slate-200">{p.total_units || 0}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Total Units</div>
                      </div>
                      <div>
                        <div className="font-bold text-emerald-400">{p.occupied_units || 0}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Occupied</div>
                      </div>
                      <div>
                        <div className="font-bold text-indigo-400">{p.amenities_count || 0}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Amenities</div>
                      </div>
                    </div>

                    {selectedPropertyDetails && selectedPropertyDetails.property.id === p.id && (
                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        <h4 className="text-xs font-bold uppercase text-slate-400">Configured Units:</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedPropertyDetails.units.map(u => (
                            <div key={u.id} className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 text-xs">
                              <div className="flex justify-between items-center font-bold">
                                <span>Unit {u.unit_number}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${u.status === 'OCCUPIED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                  {u.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1">Floor {u.floor}</div>
                              {u.tenant_name && <div className="text-[11px] text-blue-400 mt-0.5 font-medium">{u.tenant_name}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. MAINTENANCE MANAGEMENT */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Maintenance Requests & Work Orders</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  End-to-end lifecycle tracking with live technician assignment and tenant satisfaction rating.
                </p>
              </div>
              <button
                onClick={() => setModalType('newTicket')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition"
              >
                <Plus className="w-4 h-4" /> Report Issue
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-400">Filters:</span>
                <select
                  value={maintenanceFilters.status}
                  onChange={e => setMaintenanceFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CLOSED">Closed</option>
                </select>

                <select
                  value={maintenanceFilters.priority}
                  onChange={e => setMaintenanceFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 outline-none"
                >
                  <option value="ALL">All Urgencies</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <button
                onClick={loadMaintenance}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Apply
              </button>
            </div>

            {/* Tickets Grid */}
            {tickets.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                <Wrench className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-slate-300">No Maintenance Tickets Found</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Click "Report Issue" above to submit a real maintenance request.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map(t => (
                  <div key={t.id} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          Unit {t.unit_number}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            t.priority === 'EMERGENCY' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                            t.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}>
                            {t.priority}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            t.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' :
                            t.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-amber-500/20 text-amber-300'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-slate-100 leading-snug">{t.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{t.description}</p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span className="font-bold text-slate-200">{t.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Assigned Tech:</span>
                        <span className="font-bold text-slate-200">{t.staff_name || 'Unassigned'}</span>
                      </div>
                      {t.satisfaction_rating && (
                        <div className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> {t.satisfaction_rating} / 5 Stars
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        {currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && t.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              setModalData({ ticketId: t.id });
                              setModalType('assignTech');
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                          >
                            Assign Tech
                          </button>
                        )}

                        {currentUser && (currentUser.role === 'STAFF' || currentUser.role === 'OWNER') && t.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => {
                              setModalData({ ticketId: t.id });
                              setModalType('completeTicket');
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                          >
                            Mark Complete
                          </button>
                        )}

                        {currentUser && currentUser.role === 'TENANT' && t.status === 'COMPLETED' && !t.satisfaction_rating && (
                          <button
                            onClick={() => {
                              setModalData({ ticketId: t.id });
                              setModalType('rateTicket');
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                          >
                            Rate & Close
                          </button>
                        )}

                        <button
                          onClick={async () => {
                            const res = await API.getMaintenanceRequest(t.id);
                            setModalData(res);
                            setModalType('ticketDetails');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. AMENITY MANAGEMENT & ZERO-CONFLICT BOOKINGS */}
        {activeTab === 'amenities' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Amenity Reservation & Availability System</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Real-time slot reservation backed by atomic zero-conflict database locking.
                </p>
              </div>
              {currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && (
                <button
                  onClick={() => setModalType('addAmenity')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition"
                >
                  <Plus className="w-4 h-4" /> Add Amenity
                </button>
              )}
            </div>

            {/* Amenity Catalog */}
            {amenities.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                <CalendarCheck className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-slate-300">No Amenities Configured</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Property Owners can click "Add Amenity" above to register swimming pools, gyms, courts, and lounges.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {amenities.map(a => (
                  <div
                    key={a.id}
                    onClick={() => {
                      setSelectedAmenity(a);
                      loadSlots(a.id, selectedDate);
                    }}
                    className={`p-5 rounded-2xl bg-slate-900/70 border cursor-pointer transition-all ${
                      selectedAmenity?.id === a.id
                        ? 'border-emerald-500 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <CalendarCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-100">{a.name}</h4>
                        <div className="text-[11px] text-slate-400">Cap: {a.max_capacity} | {a.opening_time} - {a.closing_time}</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{a.description || 'Facility open for booking.'}</p>
                    {a.rules && (
                      <div className="mt-3 text-[11px] text-amber-400/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                        <span className="font-bold">Rule:</span> {a.rules}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Granular Slot Selector Matrix */}
            {selectedAmenity && (
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{selectedAmenity.name} Slots</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click any available slot to lock reservation. Overlapping bookings will be rejected.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-400">Select Date:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => {
                        setSelectedDate(e.target.value);
                        loadSlots(selectedAmenity.id, e.target.value);
                      }}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>

                {/* Slots Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {slotsData?.slots && slotsData.slots.length > 0 ? (
                    slotsData.slots.map(s => {
                      const myBooking = s.bookings.find(b => b.is_mine);
                      const isAvail = s.is_available;

                      return (
                        <div
                          key={s.start_time}
                          onClick={() => {
                            if (isAvail) {
                              setModalData({
                                amenityId: selectedAmenity.id,
                                amenityName: selectedAmenity.name,
                                date: selectedDate,
                                startTime: s.start_time,
                                endTime: s.end_time,
                                capacity: s.capacity_remaining
                              });
                              setModalType('bookSlot');
                            }
                          }}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            myBooking
                              ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/20 cursor-default'
                              : isAvail
                              ? 'bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/20 cursor-pointer'
                              : 'bg-rose-500/10 border-rose-500/30 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <div className="font-bold text-xs text-slate-100">{s.start_time} - {s.end_time}</div>
                          <div className="text-[10px] font-semibold mt-1">
                            {myBooking ? (
                              <span className="text-blue-400">Your Booking</span>
                            ) : isAvail ? (
                              <span className="text-emerald-400">Available ({s.capacity_remaining})</span>
                            ) : (
                              <span className="text-rose-400">Reserved</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500 col-span-full py-4 text-center">No operational slots generated for this date.</p>
                  )}
                </div>
              </div>
            )}

            {/* My Bookings & Check-in / Check-out Table */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-400" /> Active Reservations & Live Session Tracking
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5">Amenity</th>
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Time Window</th>
                      <th className="py-2.5">Resident</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {myBookings.length > 0 ? (
                      myBookings.map(b => (
                        <tr key={b.id}>
                          <td className="py-3 font-bold text-slate-200">{b.amenity_name}</td>
                          <td className="py-3 text-slate-400">{b.booking_date}</td>
                          <td className="py-3 font-semibold text-slate-200">{b.start_time} - {b.end_time}</td>
                          <td className="py-3 text-slate-400">{b.user_name} ({b.attendees_count} guests)</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              b.status === 'CONFIRMED' ? 'bg-blue-500/20 text-blue-300' :
                              b.status === 'CHECKED_IN' ? 'bg-emerald-500/20 text-emerald-300' :
                              b.status === 'COMPLETED' ? 'bg-slate-800 text-slate-400' :
                              'bg-rose-500/20 text-rose-300'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              {b.status === 'CONFIRMED' && (
                                <>
                                  <button
                                    onClick={async () => {
                                      await API.checkInBooking(b.id);
                                      addToast('Checked in successfully!', 'success');
                                      loadMyBookings();
                                    }}
                                    className="px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 font-bold text-[11px]"
                                  >
                                    Check In
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm('Cancel reservation and free up slot?')) {
                                        await API.cancelBooking(b.id);
                                        addToast('Reservation cancelled.', 'info');
                                        loadMyBookings();
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 font-bold text-[11px]"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}

                              {b.status === 'CHECKED_IN' && (
                                <button
                                  onClick={async () => {
                                    await API.checkOutBooking(b.id);
                                    addToast('Checked out of session.', 'success');
                                    loadMyBookings();
                                  }}
                                  className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 font-bold text-[11px]"
                                >
                                  Check Out
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-500">
                          {currentUser ? 'No reservations found.' : 'Sign in to view your bookings.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}

      {/* 1. Login Modal */}
      {modalType === 'login' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <LogIn className="w-5 h-5 text-blue-400" /> Sign In
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Email Address</label>
                <input name="email" type="email" required placeholder="name@domain.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Password</label>
                <input name="password" type="password" required placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition">
                Sign In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Register Modal */}
      {modalType === 'register' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" /> Register Real Account
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Full Legal Name *</label>
                <input name="full_name" type="text" required placeholder="e.g. John Doe" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Email Address *</label>
                <input name="email" type="email" required placeholder="john@domain.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Password *</label>
                  <input name="password" type="password" required minLength="6" placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Phone</label>
                  <input name="phone" type="tel" placeholder="+1-555-0100" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Role *</label>
                <select name="role" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500">
                  <option value="TENANT">Tenant / Resident</option>
                  <option value="OWNER">Property Owner / Landlord</option>
                  <option value="STAFF">Maintenance & Facilities Staff</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition">
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Property Modal */}
      {modalType === 'addProperty' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" /> Register Real Property
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddProperty} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Property Name *</label>
                <input name="name" required placeholder="e.g. Skyline Residency Towers" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Address *</label>
                <input name="address" required placeholder="123 Grand Boulevard" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">City *</label>
                  <input name="city" required placeholder="City" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">State *</label>
                  <input name="state" required placeholder="State" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Zip *</label>
                  <input name="zip_code" required placeholder="Zip" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition">
                Save Property
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Unit Modal */}
      {modalType === 'addUnit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-emerald-400" /> Add Unit
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUnit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Unit Number *</label>
                <input name="unit_number" required placeholder="e.g. Tower B - 301" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Floor *</label>
                <input name="floor" type="number" defaultValue="1" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition">
                Create Unit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add Amenity Modal */}
      {modalType === 'addAmenity' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-400" /> Register Amenity
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAmenity} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Select Property *</label>
                <select name="property_id" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none">
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Amenity Name *</label>
                <input name="name" required placeholder="e.g. Heated Swimming Pool, Badminton Court" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Description</label>
                <textarea name="description" rows="2" placeholder="Facility description..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Open Time *</label>
                  <input name="opening_time" type="time" defaultValue="08:00" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-100 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Close Time *</label>
                  <input name="closing_time" type="time" defaultValue="22:00" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-100 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Slot Mins *</label>
                  <input name="slot_duration_minutes" type="number" defaultValue="60" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-100 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Max Capacity (1 = Exclusive reservation) *</label>
                <input name="max_capacity" type="number" defaultValue="1" min="1" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Facility Rules</label>
                <input name="rules" placeholder="e.g. Non-marking shoes required" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition">
                Create Amenity
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. New Maintenance Ticket Modal */}
      {modalType === 'newTicket' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-400" /> Report Maintenance Issue
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-3" encType="multipart/form-data">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Issue Title *</label>
                <input name="title" required placeholder="e.g. Leaking kitchen tap" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Category *</label>
                  <select name="category" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none">
                    <option value="PLUMBING">Plumbing</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="HVAC">HVAC & AC</option>
                    <option value="APPLIANCE">Appliance</option>
                    <option value="STRUCTURAL">Structural</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Urgency *</label>
                  <select name="priority" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM" selected>Medium</option>
                    <option value="HIGH">High</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Description *</label>
                <textarea name="description" rows="3" required placeholder="Describe issue location, symptoms..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Attach Photo (Optional)</label>
                <input name="photo" type="file" accept="image/*" className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-200" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. Book Slot Modal */}
      {modalType === 'bookSlot' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-400" /> Reserve Amenity Slot
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-semibold space-y-1">
              <div><strong>{modalData.amenityName}</strong></div>
              <div>Date: {modalData.date} | Window: {modalData.startTime} - {modalData.endTime}</div>
            </div>
            <form onSubmit={handleBookSlot} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Number of Attendees *</label>
                <input name="attendees_count" type="number" defaultValue="1" min="1" max={modalData.capacity || 10} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Notes / Purpose</label>
                <input name="notes" placeholder="e.g. Evening workout session" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none" />
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Concurrency lock prevents duplicate overlapping bookings.
              </p>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition">
                Confirm Reservation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 8. Assign Tech Modal */}
      {modalType === 'assignTech' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100">Assign Facilities Tech</h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAssignTech} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Select Technician *</label>
                <select name="assigned_staff_id" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none">
                  {staffUsers.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Work Instructions</label>
                <input name="action_note" placeholder="Instructions..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm">
                Confirm Assignment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 9. Complete Ticket Modal */}
      {modalType === 'completeTicket' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100">Complete Repair Work</h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCompleteTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Resolution Notes *</label>
                <textarea name="resolution_notes" rows="3" required placeholder="What was repaired or replaced..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm">
                Mark Resolved
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 10. Rate Ticket Modal */}
      {modalType === 'rateTicket' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100">Rate Service & Close</h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRateTicket} className="space-y-3 text-center">
              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    onClick={() => setRatingStars(star)}
                    className={`w-7 h-7 cursor-pointer transition ${
                      star <= ratingStars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
              <div className="text-left">
                <label className="block text-xs font-bold text-slate-400 mb-1">Feedback Comments</label>
                <input name="feedback" placeholder="Punctual, clean work..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm">
                Submit CSAT Rating
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 11. Ticket Details Modal */}
      {modalType === 'ticketDetails' && modalData.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> Ticket Details & Audit Trail
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="text-base font-bold text-slate-100">{modalData.request.title}</div>
              <p className="text-slate-400 leading-relaxed">{modalData.request.description}</p>
              <div className="pt-2 flex justify-between text-slate-500">
                <span>Unit: {modalData.request.unit_number}</span>
                <span>Category: {modalData.request.category}</span>
                <span>Status: {modalData.request.status}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-400">Audit History Timeline:</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {modalData.logs && modalData.logs.map(l => (
                  <div key={l.id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                    <div className="flex justify-between font-bold text-slate-300">
                      <span>{l.user_name} ({l.user_role})</span>
                      <span className="text-[10px] text-slate-500">{new Date(l.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-400 mt-1">{l.action_note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Alerts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-2 max-w-sm ${
              t.type === 'success' ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-300' :
              t.type === 'error' ? 'bg-slate-900/95 border-rose-500/50 text-rose-300' :
              'bg-slate-900/95 border-blue-500/50 text-blue-300'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
      <Analytics />
    </div>
  );
}
