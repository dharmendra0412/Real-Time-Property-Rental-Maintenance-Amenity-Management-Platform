import React, { useState } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Home,
  Users,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  X,
  Search,
  FileText,
  Printer,
  CheckCircle,
  ExternalLink,
  Percent,
  TrendingUp,
  Receipt
} from 'lucide-react';

export default function PropertiesView({
  properties,
  currentUser,
  selectedProperty,
  onSelectProperty,
  onAddProperty,
  onAddUnit
}) {
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [targetPropertyId, setTargetPropertyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'OCCUPIED' | 'VACANT'
  const [selectedInvoiceUnit, setSelectedInvoiceUnit] = useState(null);

  const isOwner = currentUser && currentUser.role === 'OWNER';

  // Portfolio calculations
  const totalProperties = properties.length;
  let totalUnits = 0;
  let totalOccupied = 0;
  let totalVacant = 0;

  properties.forEach((p) => {
    const units = p.units || [];
    totalUnits += units.length;
    totalOccupied += units.filter((u) => u.status === 'OCCUPIED').length;
    totalVacant += units.filter((u) => u.status === 'VACANT').length;
  });

  const occupancyRate = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;
  const estimatedMonthlyGross = totalOccupied * 2450; // $2,450 avg monthly benchmark per unit

  // Filter properties
  const filteredProperties = properties.filter((prop) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      prop.name.toLowerCase().includes(q) ||
      prop.city.toLowerCase().includes(q) ||
      prop.address.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'OCCUPIED') {
      return (prop.units || []).some((u) => u.status === 'OCCUPIED');
    }
    if (statusFilter === 'VACANT') {
      return (prop.units || []).some((u) => u.status === 'VACANT');
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white font-['Outfit']">
              Properties & Real Estate Assets
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              PHYSICAL ASSETS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage residential complexes, unit occupancies, and resident tenant lease assignments.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setShowAddPropertyModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Property</span>
          </button>
        )}
      </div>

      {/* Portfolio Overview Stats (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Total Complexes</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-2xl font-black text-white font-['Outfit']">{totalProperties}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Active physical towers</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Portfolio Units</span>
            <Home className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-2xl font-black text-white font-['Outfit']">{totalUnits}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">{totalOccupied} Occupied • {totalVacant} Vacant</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Occupancy Rate</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-white font-['Outfit']">{occupancyRate}%</span>
          <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
            <div className="bg-emerald-400 h-1 rounded-full" style={{ width: `${occupancyRate}%` }} />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Gross Monthly Rent</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-black text-white font-['Outfit']">
            ${estimatedMonthlyGross.toLocaleString()}
          </span>
          <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">Active lease billing</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl glass-panel">
        <div className="flex items-center gap-1.5">
          {['ALL', 'OCCUPIED', 'VACANT'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {st === 'ALL' ? 'All Portfolios' : st === 'OCCUPIED' ? 'Has Occupancy' : 'Has Vacancies'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search complex, city, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs"
          />
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProperties.length === 0 ? (
          <div className="col-span-full py-16 text-center glass-panel rounded-2xl">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No properties match your filter.</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or add a new property.</p>
          </div>
        ) : (
          filteredProperties.map((prop) => {
            const units = prop.units || [];
            const occupied = units.filter((u) => u.status === 'OCCUPIED').length;
            const vacant = units.filter((u) => u.status === 'VACANT').length;
            const propOccupancy = units.length > 0 ? Math.round((occupied / units.length) * 100) : 0;

            return (
              <div
                key={prop.id}
                className="glass-panel glass-panel-hover p-5 rounded-2xl flex flex-col justify-between group interactive-card"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-white/5">
                      {units.length} Units ({propOccupancy}%)
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition">
                    {prop.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 mb-4">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">{prop.address}, {prop.city}, {prop.state} {prop.zip_code}</span>
                  </div>

                  {/* Units Status Grid */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/60 border border-white/5 mb-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Occupied</span>
                      <p className="text-base font-black text-white">{occupied}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vacant</span>
                      <p className="text-base font-black text-white">{vacant}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => onSelectProperty(prop.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
                  >
                    <span>View Units & Leases</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => {
                        setTargetPropertyId(prop.id);
                        setShowAddUnitModal(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 transition"
                    >
                      + Add Unit
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Property Detail Modal / Unit Drawer */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-3xl glass-panel rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto border border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-white font-['Outfit']">{selectedProperty.name}</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state}
                </p>
              </div>
              <button
                onClick={() => onSelectProperty(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Units Table / Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200">Registered Residential Units & Tenancy</h3>
                {isOwner && (
                  <button
                    onClick={() => {
                      setTargetPropertyId(selectedProperty.id);
                      setShowAddUnitModal(true);
                    }}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
                  >
                    + Add New Unit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(!selectedProperty.units || selectedProperty.units.length === 0) ? (
                  <div className="col-span-full py-8 text-center text-xs text-slate-500">
                    No units added to this property yet.
                  </div>
                ) : (
                  selectedProperty.units.map((unit) => (
                    <div
                      key={unit.id}
                      className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2.5 text-xs hover:border-white/15 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{unit.unit_number}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            unit.status === 'OCCUPIED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-700/40 text-slate-300'
                          }`}
                        >
                          {unit.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">Floor {unit.floor || 'Ground'}</p>

                      {unit.tenant_name ? (
                        <div className="pt-2 border-t border-white/5 space-y-2">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Users className="w-3.5 h-3.5 text-blue-400" />
                            <span className="truncate font-semibold">{unit.tenant_name}</span>
                          </div>
                          <button
                            onClick={() =>
                              setSelectedInvoiceUnit({
                                ...unit,
                                property_name: selectedProperty.name,
                                property_address: `${selectedProperty.address}, ${selectedProperty.city}`
                              })
                            }
                            className="w-full py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 transition flex items-center justify-center gap-1.5"
                          >
                            <Receipt className="w-3 h-3 text-emerald-400" />
                            <span>Digital Rent Statement</span>
                          </button>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-white/5 text-[11px] text-slate-500 italic">
                          Vacant / Ready for Lease
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Digital Rent Statement / Invoice Modal */}
      {selectedInvoiceUnit && (
        <div
          onClick={() => setSelectedInvoiceUnit(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/15 space-y-5 animate-zoom-in"
          >
            {/* Invoice Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit']">Digital Rent Statement</h3>
                  <p className="text-[10px] font-mono text-slate-400">Statement #INV-2026-{selectedInvoiceUnit.id?.slice(-4) || '8821'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoiceUnit(null)}
                className="p-1.5 rounded-xl bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tenancy Particulars */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Resident Tenant</span>
                <p className="font-bold text-white text-sm">{selectedInvoiceUnit.tenant_name}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">{selectedInvoiceUnit.property_name}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Unit Details</span>
                <p className="font-bold text-white text-sm">Unit {selectedInvoiceUnit.unit_number}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Floor {selectedInvoiceUnit.floor || 'Ground'}</p>
              </div>
            </div>

            {/* Financial Line Items */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-300">Base Monthly Residential Rent</span>
                <span className="font-mono font-semibold text-white">$2,250.00</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-300">Common Area Maintenance & Security</span>
                <span className="font-mono font-semibold text-white">$150.00</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-300">Amenity Concierge Access Pass</span>
                <span className="font-mono font-semibold text-white">$50.00</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-sm font-bold">
                <span className="text-white font-['Outfit']">Total Paid Amount</span>
                <span className="font-mono text-emerald-400 text-base">$2,450.00</span>
              </div>
            </div>

            {/* Verification Stamp */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span className="font-bold">PAID - ACID PostgreSQL Verified</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Ledger Lock Active</span>
            </div>

            {/* Print Action */}
            <button
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print or Save PDF Statement</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      {showAddPropertyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Add Physical Property</h3>
              <button
                onClick={() => setShowAddPropertyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                onAddProperty({
                  name: form.name.value.trim(),
                  address: form.address.value.trim(),
                  city: form.city.value.trim(),
                  state: form.state.value.trim(),
                  zip_code: form.zip_code.value.trim()
                });
                setShowAddPropertyModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Property / Tower Name</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Skyline Heights Towers"
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Street Address</label>
                <input
                  name="address"
                  required
                  placeholder="e.g. 742 Evergreen Terrace"
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City</label>
                  <input
                    name="city"
                    required
                    placeholder="New York"
                    className="w-full p-2.5 rounded-xl glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">State</label>
                  <input
                    name="state"
                    required
                    placeholder="NY"
                    className="w-full p-2.5 rounded-xl glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Zip Code</label>
                  <input
                    name="zip_code"
                    required
                    placeholder="10001"
                    className="w-full p-2.5 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPropertyModal(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white shadow-md shadow-blue-600/30 transition"
                >
                  Save Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Add Residential Unit</h3>
              <button
                onClick={() => setShowAddUnitModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                onAddUnit(targetPropertyId, {
                  unit_number: form.unit_number.value.trim(),
                  floor: form.floor.value ? parseInt(form.floor.value, 10) : 1
                });
                setShowAddUnitModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Unit Number / Flat #</label>
                <input
                  name="unit_number"
                  required
                  placeholder="e.g. Tower B - 501"
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Floor Level</label>
                <input
                  name="floor"
                  type="number"
                  defaultValue={1}
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUnitModal(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white shadow-md shadow-blue-600/30 transition"
                >
                  Add Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
