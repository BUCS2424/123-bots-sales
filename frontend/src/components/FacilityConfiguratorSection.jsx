import React, { useMemo, useState } from 'react';
import {
  HeartPulse, Warehouse, ShoppingBag, Hotel, PlaneTakeoff,
  SlidersHorizontal, X, CalendarCheck2,
} from 'lucide-react';

const backendUrl = process.env.REACT_APP_BACKEND_URL;

// Calibrated so Warehouse/3PL @ 130,000 sq ft recommends "2x Avidbots Neo 2 +
// High-Speed Sweeper" at 455 hours/mo saved - the reference spec for this tool.
const FACILITY_TYPES = [
  {
    id: 'healthcare',
    label: 'Healthcare',
    sublabel: 'Sterile focus',
    icon: HeartPulse,
    coveragePerUnitSqFt: 35000,
    hoursPerSqFtPerMonth: 0.0024,
    fleetName: (units) => `${units}x Avidbots Neo 2 (Hospital-Grade)`,
    fitting: 'Hospital-Grade Quiet Mode & Elevator Interfacing',
  },
  {
    id: 'warehouse',
    label: 'Warehouse/3PL',
    sublabel: 'Large area sq ft',
    icon: Warehouse,
    coveragePerUnitSqFt: 65000,
    hoursPerSqFtPerMonth: 0.0035,
    fleetName: (units) => `${units}x Avidbots Neo 2 + High-Speed Sweeper`,
    fitting: 'High-Bay LiDAR Mapping & Ramp Adapters',
  },
  {
    id: 'retail',
    label: 'Retail / Mall',
    sublabel: 'High foot traffic',
    icon: ShoppingBag,
    coveragePerUnitSqFt: 40000,
    hoursPerSqFtPerMonth: 0.0028,
    fleetName: (units) => `${units}x PUDU CC1 Pro (Low-Noise Mode)`,
    fitting: 'High-Traffic Obstacle Avoidance & Aisle Mapping',
  },
  {
    id: 'hospitality',
    label: 'Hospitality',
    sublabel: 'Multi-surface',
    icon: Hotel,
    coveragePerUnitSqFt: 45000,
    hoursPerSqFtPerMonth: 0.0030,
    fleetName: (units) => `${units}x PUDU CC1 Pro + Gausium Mira`,
    fitting: 'Multi-Surface Transition & Guest-Safe Navigation',
  },
];

const SUPPORTED_TAGS = [
  { label: 'Hospitals & Healthcare', icon: HeartPulse },
  { label: 'Warehouses & 3PL', icon: Warehouse },
  { label: 'Retail & Superstores', icon: ShoppingBag },
  { label: 'Hospitality & Casinos', icon: Hotel },
  { label: 'Airports & Transit', icon: PlaneTakeoff },
];

const MIN_SQFT = 10000;
const MAX_SQFT = 300000;
const DEFAULT_SQFT = 130000;
const SQFT_STEP = 5000;

const formatSqFt = (n) => (n >= MAX_SQFT ? '300,000+ Sq. Ft.' : `${n.toLocaleString()} Sq. Ft.`);

const emptyForm = (facilityId, sqft) => ({ name: '', email: '', facilityId, sqft: String(sqft), notes: '' });

const FacilityConfiguratorSection = () => {
  const [facilityId, setFacilityId] = useState('warehouse');
  const [sqft, setSqft] = useState(DEFAULT_SQFT);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(() => emptyForm('warehouse', DEFAULT_SQFT));
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // null | 'success' | 'error'

  const facility = FACILITY_TYPES.find((f) => f.id === facilityId) || FACILITY_TYPES[0];

  const { units, hoursSaved } = useMemo(() => {
    const u = Math.max(1, Math.ceil(sqft / facility.coveragePerUnitSqFt));
    const h = Math.round(sqft * facility.hoursPerSqFtPerMonth);
    return { units: u, hoursSaved: h };
  }, [sqft, facility]);

  const openModal = () => {
    setForm(emptyForm(facilityId, sqft));
    setSubmitStatus(null);
    setModalOpen(true);
  };

  const submitAudit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    const selectedFacility = FACILITY_TYPES.find((f) => f.id === form.facilityId) || facility;
    const sqftNum = parseInt(form.sqft, 10) || sqft;
    const u = Math.max(1, Math.ceil(sqftNum / selectedFacility.coveragePerUnitSqFt));
    const h = Math.round(sqftNum * selectedFacility.hoursPerSqFtPerMonth);

    setSubmitting(true);
    try {
      const res = await fetch(`${backendUrl}/api/leads/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: `Site Audit Request - ${selectedFacility.label}`,
          message:
            `Facility Type: ${selectedFacility.label}\n` +
            `Estimated Sq Footage: ${sqftNum.toLocaleString()}\n` +
            `Recommended Fleet: ${selectedFacility.fleetName(u)}\n` +
            `Est. Monthly Labor Hours Saved: ${h}\n` +
            `Custom Fitting Needed: ${selectedFacility.fitting}\n\n` +
            `Notes: ${form.notes || '—'}`,
          source: 'facility_configurator',
        }),
      });
      if (!res.ok) throw new Error('Request failed');
      setSubmitStatus('success');
    } catch (err) {
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-bots-dark relative overflow-hidden" data-testid="facility-configurator-section">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(56,189,248,0.3) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div className="animate-fade-in-left">
            <span className="inline-block px-3 py-1 rounded-full border border-blue-500/30 text-blue-300 text-xs font-semibold tracking-wide mb-4">
              CUSTOM INTEGRATION
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              Automation is Coming.{' '}
              <span className="text-cyan-400">One-Size-Fits-All Does Not.</span>
            </h2>
            <p className="text-blue-200/80 mb-4 leading-relaxed">
              Buying a robot online without operational mapping leads to sitting hardware and wasted capex. Every facility has unique floor traffic, security thresholds, elevator interfaces, and cleaning cycles.
            </p>
            <p className="text-blue-200/80 mb-8 leading-relaxed">
              123BoTs audits your physical space, selects optimal hardware across top OEM partners, and engineers a custom autonomous fleet solution built around your existing team.
            </p>
            <p className="text-xs font-semibold text-gray-400 tracking-wide mb-3">SUPPORTED ENVIRONMENTS</p>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_TAGS.map((tag) => (
                <span key={tag.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-bots-surface border border-gray-700 text-gray-300 text-sm">
                  <tag.icon className="w-4 h-4 text-blue-400" /> {tag.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right: configurator card */}
          <div className="relative animate-fade-in-right">
            <div className="absolute -top-4 right-4 z-10">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                <SlidersHorizontal className="w-3.5 h-3.5" /> INTERACTIVE CONFIGURATOR
              </span>
            </div>
            <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-b from-bots-surface to-bots-dark p-6 md:p-8 shadow-2xl shadow-blue-500/10">
              <div className="flex items-center gap-2 mb-1">
                <SlidersHorizontal className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Facility Automation Configurator</h3>
              </div>
              <p className="text-sm text-gray-400 mb-6">Configure your site parameters to receive a custom hardware & deployment blueprint.</p>

              <p className="text-xs font-semibold text-gray-400 tracking-wide mb-3">1. SELECT FACILITY TYPE</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                {FACILITY_TYPES.map((f) => {
                  const Icon = f.icon;
                  const active = f.id === facilityId;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFacilityId(f.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-colors ${
                        active ? 'border-cyan-400 bg-cyan-400/10' : 'border-gray-700 bg-bots-dark hover:border-gray-500'
                      }`}
                      data-testid={`facility-type-${f.id}`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-cyan-300' : 'text-gray-400'}`} />
                      <span className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-300'}`}>{f.label}</span>
                      <span className="text-[10px] text-gray-500">{f.sublabel}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-400 tracking-wide">2. FACILITY FLOOR COVERAGE AREA</p>
                <span className="text-cyan-400 font-bold text-sm" data-testid="facility-sqft-value">{formatSqFt(sqft)}</span>
              </div>
              <input
                type="range"
                min={MIN_SQFT}
                max={MAX_SQFT}
                step={SQFT_STEP}
                value={sqft}
                onChange={(e) => setSqft(Number(e.target.value))}
                className="w-full accent-cyan-400 mb-1"
                data-testid="facility-sqft-slider"
              />
              <div className="flex justify-between text-[11px] text-gray-500 mb-6">
                <span>10k sq ft</span>
                <span>150k sq ft</span>
                <span>300k+ sq ft</span>
              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 mb-5">
                <p className="text-xs font-semibold text-blue-300 tracking-wide mb-3">CUSTOM FLEET RECOMMENDATION & IMPACT</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-bots-dark/60 border border-gray-800 p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Recommended Fleet</p>
                    <p className="text-white font-semibold text-sm" data-testid="facility-recommended-fleet">{facility.fleetName(units)}</p>
                  </div>
                  <div className="rounded-lg bg-bots-dark/60 border border-gray-800 p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Est. Monthly Labor Hours Saved</p>
                    <p className="text-cyan-400 font-bold text-lg" data-testid="facility-hours-saved">{hoursSaved.toLocaleString()} Hours / mo</p>
                  </div>
                  <div className="rounded-lg bg-bots-dark/60 border border-gray-800 p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Custom Fitting Needed</p>
                    <p className="text-white font-semibold text-sm">{facility.fitting}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={openModal}
                className="w-full py-3.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm tracking-wide hover:from-cyan-400 hover:to-blue-500 transition-all"
                data-testid="facility-request-blueprint-btn"
              >
                REQUEST DETAILED SITE BLUEPRINT FOR THIS SPEC
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audit request modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !submitting && setModalOpen(false)} />
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-blue-500/20 bg-gradient-to-b from-bots-surface to-bots-dark p-6 shadow-2xl my-auto" data-testid="facility-audit-modal">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              aria-label="Close"
              data-testid="facility-audit-modal-close"
            >
              <X className="w-5 h-5" />
            </button>

            {submitStatus === 'success' ? (
              <div className="py-6 text-center">
                <CalendarCheck2 className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">Request Received!</h3>
                <p className="text-gray-400 text-sm">One of our automation specialists will reach out shortly to schedule your site audit.</p>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="mt-5 px-5 py-2 rounded-lg bg-bots-surface border border-gray-700 text-white text-sm hover:border-gray-500"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 text-cyan-400 text-xs font-semibold tracking-wide mb-2">
                  <CalendarCheck2 className="w-3.5 h-3.5" /> DIRECT SITE ASSESSMENT
                </span>
                <h3 className="text-xl font-bold text-white mb-1">Schedule Your Site Audit</h3>
                <p className="text-sm text-gray-400 mb-5">Our automation specialists will evaluate your facility, floor plans, and team workflow.</p>

                <form onSubmit={submitAudit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full bg-bots-dark border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
                      data-testid="facility-audit-name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Work Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="sarah@company.com"
                      className="w-full bg-bots-dark border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
                      data-testid="facility-audit-email-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">Facility Type</label>
                      <select
                        value={form.facilityId}
                        onChange={(e) => setForm((f) => ({ ...f, facilityId: e.target.value }))}
                        className="w-full bg-bots-dark border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                        data-testid="facility-audit-type-select"
                      >
                        {FACILITY_TYPES.map((f) => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">Est. Sq. Footage</label>
                      <input
                        type="number"
                        min={0}
                        value={form.sqft}
                        onChange={(e) => setForm((f) => ({ ...f, sqft: e.target.value }))}
                        placeholder="e.g. 50,000 sq ft"
                        className="w-full bg-bots-dark border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
                        data-testid="facility-audit-sqft-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Notes (optional)</label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Describe your facility types or current systems"
                      className="w-full bg-bots-dark border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                      data-testid="facility-audit-notes-input"
                    />
                  </div>

                  {submitStatus === 'error' && (
                    <p className="text-red-400 text-xs">Something went wrong submitting your request. Please try again.</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm tracking-wide hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-60"
                    data-testid="facility-audit-submit-btn"
                  >
                    {submitting ? 'Submitting...' : 'SUBMIT AUDIT REQUEST'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default FacilityConfiguratorSection;
