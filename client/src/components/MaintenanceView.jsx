import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Filter,
  Search,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  UserCheck,
  Star,
  Camera,
  X,
  ExternalLink,
  MessageSquare,
  Kanban,
  LayoutGrid,
  List,
  History,
  Droplets,
  Zap,
  Wind,
  Tv,
  Hammer
} from 'lucide-react';
import AuditLogModal from './AuditLogModal';

export default function MaintenanceView({
  tickets,
  currentUser,
  staffList,
  onCreateTicket,
  onUpdateStatus,
  onRateTicket
}) {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'grid' | 'table'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [ratingModalTicket, setRatingModalTicket] = useState(null);
  const [assignModalTicket, setAssignModalTicket] = useState(null);
  const [completeModalTicket, setCompleteModalTicket] = useState(null);
  const [auditLogTicket, setAuditLogTicket] = useState(null);

  // Form states
  const [selectedRating, setSelectedRating] = useState(5);
  const [filePreview, setFilePreview] = useState(null);

  const isTenant = currentUser && currentUser.role === 'TENANT';
  const isStaff = currentUser && currentUser.role === 'STAFF';
  const isOwner = currentUser && currentUser.role === 'OWNER';

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title && t.title.toLowerCase().includes(q);
      const matchDesc = t.description && t.description.toLowerCase().includes(q);
      const matchUnit = t.unit_number && t.unit_number.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchUnit) return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">PENDING</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">IN PROGRESS</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">COMPLETED</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">CLOSED</span>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'EMERGENCY':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <Flame className="w-3 h-3 text-rose-500 animate-pulse" />
            <span>EMERGENCY</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>HIGH</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
            LOW
          </span>
        );
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'PLUMBING': return <Droplets className="w-3.5 h-3.5 text-blue-400" />;
      case 'ELECTRICAL': return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'HVAC': return <Wind className="w-3.5 h-3.5 text-cyan-400" />;
      case 'APPLIANCE': return <Tv className="w-3.5 h-3.5 text-indigo-400" />;
      case 'CARPENTRY': return <Hammer className="w-3.5 h-3.5 text-orange-400" />;
      default: return <Wrench className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Helper renderer for a single ticket card (used in both Grid & Kanban)
  const renderTicketCard = (ticket) => (
    <div
      key={ticket.id}
      className="glass-panel glass-panel-hover p-4 rounded-2xl flex flex-col justify-between group space-y-3.5 border border-white/5"
    >
      <div>
        {/* Header: ID, Category & Priority */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            {getCategoryIcon(ticket.category)}
            <span className="text-[10px] font-mono font-bold text-slate-400">#{ticket.id.slice(-6)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {getPriorityBadge(ticket.priority)}
            {getStatusBadge(ticket.status)}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition line-clamp-1">
          {ticket.title}
        </h3>

        {/* Unit & Property */}
        <p className="text-xs text-slate-400 mt-0.5">
          Unit: <span className="text-slate-200 font-semibold">{ticket.unit_number || 'Resident'}</span> • {ticket.property_name || 'Skyline'}
        </p>

        {/* Description */}
        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
          {ticket.description}
        </p>

        {/* Photo Attachment Thumbnail */}
        {ticket.photo_url && (
          <div className="mt-3">
            <button
              onClick={() => setSelectedPhoto(ticket.photo_url)}
              className="relative rounded-xl overflow-hidden border border-white/10 group/img block max-h-28 w-full"
            >
              <img
                src={ticket.photo_url}
                alt="Issue attachment"
                className="w-full h-24 object-cover group-hover/img:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-semibold transition">
                <Camera className="w-4 h-4" />
                <span>Inspect Photo</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Footer: Assigned Tech, Rating & Actions */}
      <div className="pt-3 border-t border-white/5 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">Assigned Tech:</span>
          {ticket.assigned_staff_name ? (
            <span className="font-semibold text-cyan-400 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              {ticket.assigned_staff_name}
            </span>
          ) : (
            <span className="text-slate-500 italic text-[11px]">Unassigned</span>
          )}
        </div>

        {/* Existing Tenant CSAT Rating */}
        {ticket.satisfaction_rating && (
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${i < ticket.satisfaction_rating ? 'fill-amber-400' : 'text-slate-600'}`}
                />
              ))}
            </div>
            <span className="text-[10px] text-amber-300 font-semibold truncate max-w-[130px]">
              {ticket.tenant_feedback || '5-Star Rating'}
            </span>
          </div>
        )}

        {/* Audit Log link & Action Buttons */}
        <div className="space-y-1.5 pt-1">
          <button
            onClick={() => setAuditLogTicket(ticket)}
            className="w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-blue-400 transition py-1"
          >
            <History className="w-3 h-3" />
            <span>Inspect Audit Trail</span>
          </button>

          {/* Owner: Assign Staff */}
          {isOwner && ticket.status !== 'CLOSED' && (
            <button
              onClick={() => setAssignModalTicket(ticket)}
              className="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition"
            >
              {ticket.assigned_staff_name ? 'Reassign Staff' : 'Assign Technician'}
            </button>
          )}

          {/* Staff: Start / Complete */}
          {isStaff && (
            <>
              {ticket.status === 'PENDING' && (
                <button
                  onClick={() => onUpdateStatus(ticket.id, 'IN_PROGRESS', 'Technician commenced work on ticket')}
                  className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition shadow-sm"
                >
                  Start Work
                </button>
              )}
              {ticket.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => setCompleteModalTicket(ticket)}
                  className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition shadow-sm"
                >
                  Mark Completed
                </button>
              )}
            </>
          )}

          {/* Tenant: Rate Service */}
          {isTenant && (ticket.status === 'COMPLETED' || ticket.status === 'CLOSED') && !ticket.satisfaction_rating && (
            <button
              onClick={() => setRatingModalTicket(ticket)}
              className="w-full py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white transition flex items-center justify-center gap-1 shadow-sm"
            >
              <Star className="w-3.5 h-3.5 fill-white" />
              <span>Rate Service (CSAT)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white font-['Outfit']">
              Maintenance & Ticketing Center
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              AUDITED LIFECYCLE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time technician assignment, dispatch logs, photo inspection, and tenant CSAT reviews.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex p-1 rounded-xl bg-slate-900/80 border border-white/5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {isTenant && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl glass-panel">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {st === 'ALL' ? 'All Tickets' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Priority & Category & Search */}
        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="p-1.5 px-3 rounded-xl glass-input text-xs"
          >
            <option value="ALL">All Priorities</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-1.5 px-3 rounded-xl glass-input text-xs"
          >
            <option value="ALL">All Categories</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="HVAC">HVAC</option>
            <option value="APPLIANCE">Appliance</option>
            <option value="CARPENTRY">Carpentry</option>
            <option value="GENERAL">General</option>
          </select>

          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs"
            />
          </div>
        </div>
      </div>

      {/* Main View: Kanban Board vs Grid */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {/* Column 1: PENDING */}
          <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3 min-h-[500px]">
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Pending</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400">
                {filteredTickets.filter((t) => t.status === 'PENDING').length}
              </span>
            </div>
            <div className="space-y-3">
              {filteredTickets.filter((t) => t.status === 'PENDING').map(renderTicketCard)}
            </div>
          </div>

          {/* Column 2: IN_PROGRESS */}
          <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3 min-h-[500px]">
            <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>In Progress</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400">
                {filteredTickets.filter((t) => t.status === 'IN_PROGRESS').length}
              </span>
            </div>
            <div className="space-y-3">
              {filteredTickets.filter((t) => t.status === 'IN_PROGRESS').map(renderTicketCard)}
            </div>
          </div>

          {/* Column 3: COMPLETED */}
          <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3 min-h-[500px]">
            <div className="flex items-center justify-between pb-2 border-b border-teal-500/20">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                <span>Completed</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-400">
                {filteredTickets.filter((t) => t.status === 'COMPLETED').length}
              </span>
            </div>
            <div className="space-y-3">
              {filteredTickets.filter((t) => t.status === 'COMPLETED').map(renderTicketCard)}
            </div>
          </div>

          {/* Column 4: CLOSED */}
          <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3 min-h-[500px]">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Closed</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                {filteredTickets.filter((t) => t.status === 'CLOSED').length}
              </span>
            </div>
            <div className="space-y-3">
              {filteredTickets.filter((t) => t.status === 'CLOSED').map(renderTicketCard)}
            </div>
          </div>
        </div>
      ) : (
        /* Regular Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTickets.length === 0 ? (
            <div className="col-span-full py-16 text-center glass-panel rounded-2xl">
              <Wrench className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">No maintenance tickets found.</p>
              <p className="text-xs text-slate-500 mt-1">No requests match the selected filters.</p>
            </div>
          ) : (
            filteredTickets.map(renderTicketCard)
          )}
        </div>
      )}

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={!!auditLogTicket}
        ticket={auditLogTicket}
        onClose={() => setAuditLogTicket(null)}
      />

      {/* Lightbox Photo Preview Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
        >
          <div className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden glass-panel p-2 shadow-2xl">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 text-white hover:bg-black/90 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedPhoto} alt="Full resolution preview" className="max-w-full max-h-[80vh] rounded-xl object-contain mx-auto" />
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass-panel rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Report Maintenance Issue</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                const formData = new FormData();
                formData.append('title', form.title.value.trim());
                formData.append('description', form.description.value.trim());
                formData.append('priority', form.priority.value);
                formData.append('category', form.category.value);
                if (form.photo.files[0]) {
                  formData.append('photo', form.photo.files[0]);
                }
                onCreateTicket(formData);
                setShowCreateModal(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Issue Title</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Bathroom pipe leaking under the sink"
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select name="category" className="w-full p-2.5 rounded-xl glass-input text-xs">
                    <option value="PLUMBING">Plumbing</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="HVAC">HVAC / Air Conditioning</option>
                    <option value="APPLIANCE">Appliance</option>
                    <option value="CARPENTRY">Carpentry</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Urgency / Priority</label>
                  <select name="priority" className="w-full p-2.5 rounded-xl glass-input text-xs">
                    <option value="LOW">Low (Routine maintenance)</option>
                    <option value="MEDIUM">Medium (Standard)</option>
                    <option value="HIGH">High (Urgent)</option>
                    <option value="EMERGENCY">Emergency (Hazard/Active leak)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Detailed Description</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Please describe what occurred, when it started, and exact room..."
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Attach Photo (Optional)</label>
                <input
                  name="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setFilePreview(URL.createObjectURL(file));
                    else setFilePreview(null);
                  }}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 transition cursor-pointer"
                />
                {filePreview && (
                  <img src={filePreview} alt="Preview" className="h-20 w-auto rounded-xl mt-2 border border-white/10 object-cover" />
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white shadow-md shadow-blue-600/30 transition"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSAT Rating Modal */}
      {ratingModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-panel rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Rate Technician Service</h3>
              <button onClick={() => setRatingModalTicket(null)} className="p-1 rounded-lg text-slate-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              How satisfied are you with the resolution of: <span className="text-slate-200 font-semibold">{ratingModalTicket.title}</span>?
            </p>

            <div className="flex items-center justify-center gap-2 py-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedRating(star)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= selectedRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onRateTicket(ratingModalTicket.id, selectedRating, e.target.feedback.value.trim());
                setRatingModalTicket(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Feedback / Comments</label>
                <textarea
                  name="feedback"
                  rows={2}
                  placeholder="e.g. Technician arrived promptly, fixed the valve cleanly!"
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRatingModalTicket(null)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-semibold text-white shadow-md shadow-amber-600/30 transition"
                >
                  Submit CSAT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {assignModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-panel rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Assign Technician</h3>
              <button onClick={() => setAssignModalTicket(null)} className="p-1 rounded-lg text-slate-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const staffId = e.target.staff_id.value;
                const staff = staffList.find((s) => s.id === staffId);
                onUpdateStatus(assignModalTicket.id, 'IN_PROGRESS', `Assigned to ${staff ? staff.full_name : 'Staff'} for maintenance`, staffId);
                setAssignModalTicket(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Facilities Staff</label>
                <select name="staff_id" required className="w-full p-2.5 rounded-xl glass-input text-xs">
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.full_name} ({st.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalTicket(null)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white transition"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Ticket Modal */}
      {completeModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-panel rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Mark Ticket Completed</h3>
              <button onClick={() => setCompleteModalTicket(null)} className="p-1 rounded-lg text-slate-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const note = e.target.note.value.trim() || 'Work completed and verified';
                onUpdateStatus(completeModalTicket.id, 'COMPLETED', note);
                setCompleteModalTicket(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Resolution Summary</label>
                <textarea
                  name="note"
                  required
                  rows={3}
                  placeholder="Detail work performed (e.g. Replaced faulty washer, pressure tested)"
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompleteModalTicket(null)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white transition"
                >
                  Complete Work
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
