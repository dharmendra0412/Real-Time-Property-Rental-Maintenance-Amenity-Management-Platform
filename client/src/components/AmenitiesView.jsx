import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Plus,
  X,
  ChevronRight,
  LogOut,
  LogIn
} from 'lucide-react';

export default function AmenitiesView({
  amenities,
  selectedAmenity,
  selectedDate,
  availableSlots,
  myBookings,
  currentUser,
  onSelectAmenity,
  onChangeDate,
  onBookSlot,
  onCheckIn,
  onCheckOut,
  onCancelBooking,
  onAddAmenity
}) {
  const [showAddAmenityModal, setShowAddAmenityModal] = useState(false);
  const isOwner = currentUser && currentUser.role === 'OWNER';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white font-['Outfit']">
              Amenity Hub & Dynamic Reservation
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              ACID CONCURRENCY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time slot reservation engine backed by PostgreSQL row-locking to strictly eliminate double-bookings.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setShowAddAmenityModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Amenity</span>
          </button>
        )}
      </div>

      {/* Main Grid: Left Amenities Showcase + Right Slot Picker / My Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Amenity Cards Directory */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-200">Available Amenities</h2>
          <div className="space-y-3">
            {amenities.length === 0 ? (
              <div className="py-12 text-center glass-panel rounded-2xl text-xs text-slate-500">
                No amenities registered yet.
              </div>
            ) : (
              amenities.map((amenity) => {
                const isSelected = selectedAmenity && selectedAmenity.id === amenity.id;
                return (
                  <div
                    key={amenity.id}
                    onClick={() => onSelectAmenity(amenity)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                        : 'glass-panel hover:bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-xl ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-indigo-500/10 text-indigo-400'
                          }`}
                        >
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{amenity.name}</h3>
                          <p className="text-[11px] text-slate-400">
                            {amenity.opening_time} - {amenity.closing_time} • {amenity.slot_duration_minutes}m slots
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-500 ${isSelected ? 'rotate-90 text-indigo-400' : ''}`} />
                    </div>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {amenity.description || 'Premium residential amenity available for tenant booking.'}
                    </p>

                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-500" />
                        Max {amenity.max_capacity} capacity
                      </span>
                      {amenity.rules && (
                        <span className="truncate">• {amenity.rules}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Time-Slot Picker & My Active Bookings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Slot Picker Card */}
          {selectedAmenity ? (
            <div className="glass-panel p-6 rounded-2xl space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Reserve: {selectedAmenity.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select a date and time slot to create an atomic transaction reservation.
                  </p>
                </div>

                {/* Date Picker Input */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onChangeDate(e.target.value)}
                    className="p-1.5 px-3 rounded-xl glass-input text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Time Slots Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Slots for {selectedDate}
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {availableSlots.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs text-slate-500">
                      Loading available slots for {selectedDate}...
                    </div>
                  ) : (
                    availableSlots.map((slot, index) => {
                      const isAvailable = slot.available;
                      const isMySlot = slot.is_my_booking;

                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            isMySlot
                              ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                              : isAvailable
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
                              : 'bg-slate-900/40 border-white/5 text-slate-500 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1 text-xs font-bold mb-1">
                            <Clock className="w-3 h-3" />
                            <span>{slot.start_time} - {slot.end_time}</span>
                          </div>

                          <div className="text-[10px] font-semibold mt-1">
                            {isMySlot ? (
                              <span className="text-blue-400 font-bold">Your Booking</span>
                            ) : isAvailable ? (
                              <button
                                onClick={() =>
                                  onBookSlot({
                                    amenity_id: selectedAmenity.id,
                                    booking_date: selectedDate,
                                    start_time: slot.start_time,
                                    end_time: slot.end_time
                                  })
                                }
                                className="w-full py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm"
                              >
                                Book Slot
                              </button>
                            ) : (
                              <span className="text-slate-500">Reserved</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-10 rounded-2xl text-center text-slate-500 text-xs">
              Select an amenity from the list to view real-time availability and reserve slots.
            </div>
          )}

          {/* My Active Reservations Section */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>My Active Reservations</span>
              </h3>
              <span className="text-xs text-slate-400">{myBookings.length} total</span>
            </div>

            <div className="space-y-3">
              {myBookings.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  You have no active reservations yet. Book a slot above!
                </p>
              ) : (
                myBookings.map((bk) => (
                  <div
                    key={bk.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{bk.amenity_name}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            bk.status === 'CONFIRMED'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : bk.status === 'CHECKED_IN'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'
                              : bk.status === 'COMPLETED'
                              ? 'bg-teal-500/10 text-teal-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {bk.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Date: <span className="text-slate-200 font-semibold">{bk.booking_date}</span> • Slot:{' '}
                        <span className="text-slate-200 font-semibold">
                          {bk.start_time} - {bk.end_time}
                        </span>
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {bk.status === 'CONFIRMED' && (
                        <>
                          <button
                            onClick={() => onCheckIn(bk.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                          >
                            Check-In
                          </button>
                          <button
                            onClick={() => onCancelBooking(bk.id)}
                            className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {bk.status === 'CHECKED_IN' && (
                        <button
                          onClick={() => onCheckOut(bk.id)}
                          className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold transition"
                        >
                          Check-Out
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Amenity Modal (Owner Only) */}
      {showAddAmenityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Register New Amenity</h3>
              <button
                onClick={() => setShowAddAmenityModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                onAddAmenity({
                  name: form.name.value.trim(),
                  description: form.description.value.trim(),
                  opening_time: form.opening_time.value,
                  closing_time: form.closing_time.value,
                  slot_duration_minutes: parseInt(form.slot_duration_minutes.value, 10),
                  max_capacity: parseInt(form.max_capacity.value, 10),
                  rules: form.rules.value.trim()
                });
                setShowAddAmenityModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Amenity Name</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Olympic Size Swimming Pool"
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Facility features, location within complex..."
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Opening Time</label>
                  <input
                    name="opening_time"
                    type="time"
                    defaultValue="06:00"
                    required
                    className="w-full p-2 rounded-xl glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Closing Time</label>
                  <input
                    name="closing_time"
                    type="time"
                    defaultValue="22:00"
                    required
                    className="w-full p-2 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Slot Duration (Mins)</label>
                  <input
                    name="slot_duration_minutes"
                    type="number"
                    defaultValue={60}
                    required
                    className="w-full p-2 rounded-xl glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Capacity</label>
                  <input
                    name="max_capacity"
                    type="number"
                    defaultValue={10}
                    required
                    className="w-full p-2 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Usage Guidelines / Rules</label>
                <input
                  name="rules"
                  placeholder="e.g. Non-marking shoes required, shower before entering"
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAmenityModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-md shadow-indigo-600/30 transition"
                >
                  Save Amenity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
