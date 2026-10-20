import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API } from './api';

// Professional Modular Components
import Navbar from './components/Navbar';
import DashboardOverview from './components/DashboardOverview';
import PropertiesView from './components/PropertiesView';
import MaintenanceView from './components/MaintenanceView';
import AmenitiesView from './components/AmenitiesView';
import AuthModal from './components/AuthModal';
import ToastContainer from './components/ToastContainer';
import CommandPalette from './components/CommandPalette';

export default function App() {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Core Data State
  const [currentUser, setCurrentUser] = useState(null);
  const [userContext, setUserContext] = useState({});
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Connectivity
  const [liveConnected, setLiveConnected] = useState(false);
  const [cloudOnline, setCloudOnline] = useState(false);

  // Audio Context Ref
  const audioCtxRef = useRef(null);

  // Global Ctrl+K / Cmd+K Command Palette Shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Toast Notification Helper
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 2. Web Audio Subtle Sound Chimes
  const playChime = (f1 = 520, f2 = 660) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(f1, now);
      osc2.frequency.setValueAtTime(f2, now + 0.08);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.08);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } catch {}
  };

  // 3. Initial Auth Verification & WebSocket Setup
  useEffect(() => {
    // Check local token
    const token = API.getToken();
    if (token) {
      API.getMe()
        .then((res) => {
          setCurrentUser(res.user);
          setUserContext(res.context || {});
        })
        .catch(() => {
          API.logout();
          setCurrentUser(null);
        });
    }

    // Health Check Ping (PostgreSQL & Serverless ping)
    const checkHealth = () => {
      fetch('/api/health')
        .then((r) => r.json())
        .then((data) => {
          if (data && data.status === 'ONLINE') {
            setCloudOnline(true);
          } else {
            setCloudOnline(false);
          }
        })
        .catch(() => setCloudOnline(false));
    };

    checkHealth();
    const healthTimer = setInterval(checkHealth, 15000);

    // WebSocket bi-directional streaming
    let socket = null;
    try {
      socket = io({ transports: ['websocket', 'polling'], timeout: 4000 });

      socket.on('connect', () => {
        setLiveConnected(true);
      });

      socket.on('disconnect', () => {
        setLiveConnected(false);
      });

      // Real-time Event Broadcasters
      socket.on('maintenance:created', (data) => {
        playChime(520, 660);
        addToast(`New ticket logged: "${data.title}"`, 'info');
        refreshAll();
      });

      socket.on('maintenance:updated', (data) => {
        playChime(660, 880);
        addToast(`Ticket status updated to ${data.status}`, 'success');
        refreshAll();
      });

      socket.on('maintenance:rated', (data) => {
        playChime(700, 900);
        addToast(`Tenant rated ${data.rating} Stars!`, 'success');
        refreshAll();
      });

      socket.on('amenity:booked', (data) => {
        playChime(440, 580);
        addToast(`Amenity slot booked: ${data.amenity_name} (${data.slot})`, 'info');
        refreshAll();
      });

      socket.on('amenity:checked_in', (data) => {
        addToast(`Checked in to ${data.amenity_name}`, 'success');
        refreshAll();
      });

      socket.on('amenity:checked_out', (data) => {
        addToast(`Checked out of ${data.amenity_name}`, 'success');
        refreshAll();
      });

      socket.on('amenity:cancelled', (data) => {
        addToast(`Reservation cancelled for ${data.amenity_name} (Slot released)`, 'info');
        refreshAll();
      });
    } catch {}

    // Fallback polling for serverless (when WebSockets sleep)
    const pollTimer = setInterval(() => {
      if (!liveConnected) {
        loadDashboardStats();
      }
    }, 12000);

    return () => {
      clearInterval(healthTimer);
      clearInterval(pollTimer);
      if (socket) socket.disconnect();
    };
  }, []);

  // 4. Data Refresh on Tab or User change
  const refreshAll = () => {
    loadDashboardStats();
    loadProperties();
    loadTickets();
    loadAmenities();
    if (selectedAmenity) {
      loadSlots(selectedAmenity.id, selectedDate);
    }
    if (API.getToken()) {
      loadMyBookings();
      loadStaff();
    }
  };

  useEffect(() => {
    refreshAll();
  }, [activeTab, currentUser]);

  // Load individual data slices
  const loadDashboardStats = () => {
    API.getStats()
      .then(setStats)
      .catch(() => {});
  };

  const loadProperties = async () => {
    try {
      const data = await API.getProperties();
      setProperties(data || []);
      if (data && data.length > 0 && !selectedProperty) {
        setSelectedProperty(data[0]);
      }
    } catch {
      try {
        const pub = await API.getPublicProperties();
        setProperties(pub || []);
      } catch {}
    }
  };

  const loadTickets = async () => {
    if (!API.getToken()) return;
    try {
      const data = await API.getMaintenanceRequests();
      setTickets(data || []);
    } catch {
      setTickets([]);
    }
  };

  const loadAmenities = async () => {
    try {
      const data = await API.getAmenities();
      setAmenities(data || []);
      if (data && data.length > 0 && !selectedAmenity) {
        setSelectedAmenity(data[0]);
        loadSlots(data[0].id, selectedDate);
      }
    } catch {
      setAmenities([]);
    }
  };

  const loadSlots = async (amenityId, date) => {
    if (!amenityId) return;
    try {
      const data = await API.getAmenityAvailability(amenityId, date);
      setAvailableSlots(data.slots || []);
    } catch {
      setAvailableSlots([]);
    }
  };

  const loadMyBookings = async () => {
    if (!API.getToken()) return;
    try {
      const data = await API.getMyBookings();
      setMyBookings(data || []);
    } catch {
      setMyBookings([]);
    }
  };

  const loadStaff = async () => {
    try {
      const data = await API.getUsers('STAFF');
      setStaffList(data || []);
    } catch {
      setStaffList([]);
    }
  };

  // 5. Auth Handlers
  const handleLogin = async (email, password) => {
    try {
      const res = await API.login(email, password);
      API.setToken(res.token);
      setCurrentUser(res.user);
      setUserContext(res.context || {});
      setAuthModalOpen(false);
      addToast(`Welcome back, ${res.user.full_name}!`, 'success');
      playChime(660, 880);
      refreshAll();
    } catch (err) {
      addToast(err.message, 'error');
      throw err;
    }
  };

  const handleRegister = async (payload) => {
    try {
      const res = await API.register(payload);
      API.setToken(res.token);
      setCurrentUser(res.user);
      setAuthModalOpen(false);
      addToast(`Account created successfully! Welcome, ${res.user.full_name}.`, 'success');
      playChime(660, 880);
      refreshAll();
    } catch (err) {
      addToast(err.message, 'error');
      throw err;
    }
  };

  const handleGoogleLogin = async (payload) => {
    try {
      const res = await API.googleLogin(payload);
      API.setToken(res.token);
      setCurrentUser(res.user);
      setAuthModalOpen(false);
      addToast(`Signed in with Google as ${res.user.full_name}!`, 'success');
      playChime(660, 880);
      refreshAll();
    } catch (err) {
      addToast(err.message, 'error');
      throw err;
    }
  };

  const handleLogout = () => {
    API.logout();
    setCurrentUser(null);
    setUserContext({});
    addToast('Signed out successfully.', 'info');
    refreshAll();
  };

  const handleQuickDemo = (email, password) => {
    handleLogin(email, password);
  };

  // 6. Action Handlers
  const handleSelectAmenity = (amenity) => {
    setSelectedAmenity(amenity);
    loadSlots(amenity.id, selectedDate);
  };

  const handleChangeDate = (newDate) => {
    setSelectedDate(newDate);
    if (selectedAmenity) {
      loadSlots(selectedAmenity.id, newDate);
    }
  };

  const handleBookSlot = async (bookingData) => {
    if (!currentUser) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      addToast('Please sign in to reserve an amenity slot.', 'warning');
      return;
    }
    try {
      await API.bookAmenity(bookingData);
      addToast('Amenity reserved successfully! Concurrency check verified.', 'success');
      playChime(660, 880);
      refreshAll();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleCheckIn = async (bookingId) => {
    try {
      await API.checkInBooking(bookingId);
      addToast('Checked in successfully! Enjoy your session.', 'success');
      refreshAll();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleCheckOut = async (bookingId) => {
    try {
      await API.checkOutBooking(bookingId);
      addToast('Checked out successfully. Slot completed!', 'success');
      refreshAll();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await API.cancelBooking(bookingId);
      addToast('Reservation cancelled and slot immediately released.', 'info');
      refreshAll();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleCreateTicket = async (formData) => {
    try {
      await API.createMaintenanceRequest(formData);
      addToast('Maintenance ticket submitted and dispatched to facilities!', 'success');
      playChime(660, 880);
      refreshAll();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleUpdateStatus = async (ticketId, status, note, staffId) => {
    try {
      await API.updateTicketStatus(ticketId, { status, note, staff_id: staffId });
      addToast(`Ticket status updated to ${status}!`, 'success');
      playChime(660, 880);
      refreshAll();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleRateTicket = async (ticketId, rating, feedback) => {
    try {
      await API.rateTicket(ticketId, rating, feedback);
      addToast('Thank you! Your CSAT review has been recorded.', 'success');
      playChime(700, 900);
      refreshAll();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAddProperty = async (propData) => {
    try {
      await API.createProperty(propData);
      addToast('Property registered successfully in database!', 'success');
      refreshAll();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAddUnit = async (propertyId, unitData) => {
    try {
      await API.createUnit(propertyId, unitData);
      addToast('Residential unit added successfully!', 'success');
      refreshAll();
      if (selectedProperty && selectedProperty.id === propertyId) {
        const updated = await API.getProperty(propertyId);
        setSelectedProperty(updated);
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAddAmenity = async (amenityData) => {
    try {
      const propId = properties.length > 0 ? properties[0].id : null;
      await API.createAmenity({ ...amenityData, property_id: propId });
      addToast('Amenity registered and available for bookings!', 'success');
      refreshAll();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // 7. Audit Report Export (Enterprise JSON Snapshot)
  const handleExportReport = () => {
    try {
      const report = {
        platform: 'Skyline Real-Time Management Platform',
        timestamp: new Date().toISOString(),
        engine: '100% Pure PostgreSQL (Neon Cloud)',
        concurrency: 'ACID Transaction Locks Enforced',
        kpis: stats?.kpis || {},
        maintenance_overview: stats?.maintenance || {},
        amenities_overview: stats?.amenities || {},
        recent_activity_feed: stats?.activity_feed || [],
        total_properties: properties.length,
        total_tickets: tickets.length,
        total_amenities: amenities.length
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `skyline_operational_audit_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      addToast('Operational audit snapshot downloaded successfully!', 'success');
    } catch (err) {
      addToast('Failed to export report: ' + err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Inter'] relative selection:bg-blue-600 selection:text-white">
      {/* Background Subtle Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-[128px]" />
      </div>

      {/* 1. High-End Sticky Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        liveConnected={liveConnected}
        cloudOnline={cloudOnline}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onQuickLogin={handleQuickDemo}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onExportReport={handleExportReport}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            stats={stats}
            onRefresh={refreshAll}
            setActiveTab={setActiveTab}
            onOpenNewTicket={() => setActiveTab('maintenance')}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'properties' && (
          <PropertiesView
            properties={properties}
            currentUser={currentUser}
            selectedProperty={selectedProperty}
            onSelectProperty={async (id) => {
              if (!id) {
                setSelectedProperty(null);
                return;
              }
              try {
                const p = await API.getProperty(id);
                setSelectedProperty(p);
              } catch {
                const found = properties.find((x) => x.id === id);
                setSelectedProperty(found || null);
              }
            }}
            onAddProperty={handleAddProperty}
            onAddUnit={handleAddUnit}
          />
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceView
            tickets={tickets}
            currentUser={currentUser}
            staffList={staffList}
            onCreateTicket={handleCreateTicket}
            onUpdateStatus={handleUpdateStatus}
            onRateTicket={handleRateTicket}
          />
        )}

        {activeTab === 'amenities' && (
          <AmenitiesView
            amenities={amenities}
            selectedAmenity={selectedAmenity}
            selectedDate={selectedDate}
            availableSlots={availableSlots}
            myBookings={myBookings}
            currentUser={currentUser}
            onSelectAmenity={handleSelectAmenity}
            onChangeDate={handleChangeDate}
            onBookSlot={handleBookSlot}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onCancelBooking={handleCancelBooking}
            onAddAmenity={handleAddAmenity}
          />
        )}
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-white/5 py-6 bg-slate-950/80 backdrop-blur-md relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© 2026 Skyline Enterprise Platform. Certified 100% Pure PostgreSQL Engine.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 glow-dot-emerald" />
              <span>Zero Mock Simulation</span>
            </span>
            <span>•</span>
            <span>ACID Concurrency Shield</span>
            <span>•</span>
            <span>WebSocket Live Streaming</span>
          </div>
        </div>
      </footer>

      {/* 4. Command Palette (Spotlight Search: Ctrl+K / Cmd+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        setActiveTab={setActiveTab}
        onQuickLogin={handleQuickDemo}
        onOpenNewTicket={() => setActiveTab('maintenance')}
        onExportReport={handleExportReport}
      />

      {/* 5. Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGoogleLogin={handleGoogleLogin}
        onQuickDemo={handleQuickDemo}
      />

      {/* 6. Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
