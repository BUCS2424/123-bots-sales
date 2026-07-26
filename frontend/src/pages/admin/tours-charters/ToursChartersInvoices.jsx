import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Pencil, Receipt, Loader2, X, ExternalLink, CheckCircle2, Ban, Settings2, Send } from 'lucide-react';
import { toursChartersApi } from './toursChartersApi';
import { toast } from '../../../hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../components/ui/sheet';

const inputCls = 'w-full rounded-lg border border-white/10 bg-[#061a1f] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-teal-500/50';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const emptyLineItem = { description: '', booking_ref: '', qty: 1, rate: 0, tax_percent: 0 };
const emptyInvoice = {
  seller_id: '', invoice_date: '', sale_agent: '',
  line_items: [{ ...emptyLineItem }],
  custom_note: '', bank_info: '', venmo_info: '', check_info: '',
};

const statusStyles = {
  unpaid: 'bg-amber-500/15 text-amber-300',
  paid: 'bg-emerald-500/15 text-emerald-300',
  void: 'bg-white/10 text-white/40',
};

const ToursChartersInvoices = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState({ default_bank_info: '', default_venmo_info: '', default_check_info: '', default_custom_note: '', default_sale_agent: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const sellerFilter = searchParams.get('seller_id') || '';

  const load = () => {
    setLoading(true);
    Promise.all([toursChartersApi.listInvoices(), toursChartersApi.listSellers(), toursChartersApi.getInvoiceSettings()])
      .then(([invRes, sellerRes, settingsRes]) => {
        setInvoices(invRes.data || []);
        setSellers(sellerRes.data || []);
        setInvoiceSettings(settingsRes.data || {});
      }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filteredInvoices = sellerFilter ? invoices.filter((i) => i.seller_id === sellerFilter) : invoices;

  const openCreate = () => {
    setModal({
      ...emptyInvoice,
      seller_id: sellerFilter || '',
      sale_agent: invoiceSettings.default_sale_agent || '',
      bank_info: invoiceSettings.default_bank_info || '',
      venmo_info: invoiceSettings.default_venmo_info || '',
      check_info: invoiceSettings.default_check_info || '',
      custom_note: invoiceSettings.default_custom_note || '',
      line_items: [{ ...emptyLineItem }],
    });
  };

  const totals = useMemo(() => {
    if (!modal) return { subtotal: 0, tax_amount: 0, total: 0 };
    let subtotal = 0, tax = 0;
    (modal.line_items || []).forEach((li) => {
      const amt = (parseFloat(li.qty) || 0) * (parseFloat(li.rate) || 0);
      subtotal += amt;
      tax += amt * ((parseFloat(li.tax_percent) || 0) / 100);
    });
    return { subtotal, tax_amount: tax, total: subtotal + tax };
  }, [modal]);

  const updateLineItem = (idx, field, value) => {
    const items = [...modal.line_items];
    items[idx] = { ...items[idx], [field]: value };
    setModal({ ...modal, line_items: items });
  };
  const addLineItem = () => setModal({ ...modal, line_items: [...modal.line_items, { ...emptyLineItem }] });
  const removeLineItem = (idx) => setModal({ ...modal, line_items: modal.line_items.filter((_, i) => i !== idx) });

  const save = async () => {
    if (!modal.seller_id) { toast({ title: 'Select a charter company', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const payload = { ...modal, line_items: modal.line_items.map((li) => ({ ...li, qty: parseFloat(li.qty) || 0, rate: parseFloat(li.rate) || 0, tax_percent: parseFloat(li.tax_percent) || 0 })) };
      if (modal.id) await toursChartersApi.updateInvoice(modal.id, payload);
      else await toursChartersApi.createInvoice(payload);
      toast({ title: modal.id ? 'Invoice updated' : 'Invoice created' });
      setModal(null); load();
    } catch (e) { toast({ title: 'Error', description: e.response?.data?.detail, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const markPaid = async (inv) => {
    if (!window.confirm(`Mark invoice ${inv.invoice_number} as paid?`)) return;
    try { await toursChartersApi.updateInvoice(inv.id, { status: 'paid' }); toast({ title: 'Marked as paid' }); load(); }
    catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const voidInvoice = async (inv) => {
    if (!window.confirm(`Void invoice ${inv.invoice_number}?`)) return;
    try { await toursChartersApi.updateInvoice(inv.id, { status: 'void' }); toast({ title: 'Invoice voided' }); load(); }
    catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const del = async (inv) => {
    if (!window.confirm(`Delete invoice ${inv.invoice_number}? This cannot be undone.`)) return;
    try { await toursChartersApi.deleteInvoice(inv.id); toast({ title: 'Deleted' }); load(); }
    catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const sendToCompany = async (inv) => {
    setSendingId(inv.id);
    try {
      const res = await toursChartersApi.sendInvoiceEmail(inv.id, { origin_url: window.location.origin });
      if (res.data.email_sent) {
        toast({ title: 'Email sent', description: `Invoice emailed to ${res.data.recipient}` });
      } else {
        try { await navigator.clipboard.writeText(res.data.invoice_link); } catch { /* clipboard may be unavailable */ }
        toast({ title: 'Email not sent (SMTP not configured)', description: 'Invoice link copied to clipboard instead - share it manually.', variant: 'destructive' });
      }
      load();
    } catch (e) { toast({ title: 'Error', description: e.response?.data?.detail, variant: 'destructive' }); }
    finally { setSendingId(null); }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try { await toursChartersApi.updateInvoiceSettings(invoiceSettings); toast({ title: 'Invoice defaults saved' }); setSettingsOpen(false); }
    catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSavingSettings(false); }
  };

  return (
    <div className="-m-4 min-h-screen bg-[#061a1f] p-5 text-white lg:-m-6 lg:p-8" data-testid="tours-charters-invoices-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black"><Receipt className="h-6 w-6 text-teal-400" /> Invoices</h1>
          <p className="text-sm text-white/40">{filteredInvoices.length} of {invoices.length} invoices{sellerFilter && ' (filtered by charter company)'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSettingsOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white/60 hover:bg-white/10" data-testid="invoice-settings-btn">
            <Settings2 className="h-4 w-4" /> Defaults
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-2.5 text-sm font-semibold" data-testid="add-invoice-btn">
            <Plus className="h-4 w-4" /> Create Invoice
          </button>
        </div>
      </div>

      {sellerFilter && (
        <button onClick={() => setSearchParams({})} className="mb-4 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/10" data-testid="invoice-clear-seller-filter">
          Clear company filter
        </button>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-teal-400" /></div>
      ) : filteredInvoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1f24] py-16 text-center text-white/40" data-testid="invoices-empty">No invoices yet. Create your first one.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b1f24]" data-testid="invoices-list">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
                <th className="p-3">Invoice #</th>
                <th className="p-3">Charter Company</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-right">Due</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/5" data-testid={`invoice-row-${inv.id}`}>
                  <td className="p-3 font-mono text-xs">
                    {inv.invoice_number}
                    {inv.last_sent_at && (
                      <p className="mt-0.5 font-sans text-[10px] normal-case text-white/30" data-testid={`invoice-last-sent-${inv.id}`}>Sent {inv.last_sent_at.slice(0, 10)}</p>
                    )}
                  </td>
                  <td className="p-3">{inv.seller_name}</td>
                  <td className="p-3 text-white/60">{inv.invoice_date}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusStyles[inv.status] || 'bg-white/10 text-white/40'}`} data-testid={`invoice-status-${inv.id}`}>{inv.status}</span>
                  </td>
                  <td className="p-3 text-right font-semibold">${inv.total?.toFixed(2)}</td>
                  <td className="p-3 text-right text-white/60">${inv.amount_due?.toFixed(2)}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => sendToCompany(inv)} disabled={sendingId === inv.id} className="rounded-lg p-1.5 text-sky-300 hover:bg-sky-500/10 disabled:opacity-50" title="Send to charter company" data-testid={`invoice-send-email-${inv.id}`}>
                        {sendingId === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      </button>
                      <a href={`${BACKEND_URL}/invoice/tours-charters/${inv.id}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 text-teal-300 hover:bg-teal-500/10" title="View public invoice" data-testid={`invoice-view-${inv.id}`}><ExternalLink className="h-3.5 w-3.5" /></a>
                      {inv.status === 'unpaid' && (
                        <button onClick={() => markPaid(inv)} className="rounded-lg p-1.5 text-emerald-300 hover:bg-emerald-500/10" title="Mark paid" data-testid={`invoice-mark-paid-${inv.id}`}><CheckCircle2 className="h-3.5 w-3.5" /></button>
                      )}
                      {inv.status !== 'void' && (
                        <button onClick={() => voidInvoice(inv)} className="rounded-lg p-1.5 text-white/40 hover:bg-white/10" title="Void" data-testid={`invoice-void-${inv.id}`}><Ban className="h-3.5 w-3.5" /></button>
                      )}
                      <button onClick={() => setModal({ ...inv })} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10" data-testid={`invoice-edit-${inv.id}`}><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => del(inv)} className="rounded-lg p-1.5 text-red-300 hover:bg-red-500/10" data-testid={`invoice-delete-${inv.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Sheet open={!!modal} onOpenChange={(open) => !open && setModal(null)}>
          <SheetContent side="right" className="w-full sm:max-w-2xl bg-[#0b1f24] border-white/10 text-white overflow-y-auto" data-testid="invoice-modal">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-white"><Receipt className="h-5 w-5 text-teal-300" /> {modal.id ? `Edit Invoice ${modal.invoice_number}` : 'New Invoice'}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">Charter Company</label>
                  <select className={inputCls} value={modal.seller_id} onChange={(e) => setModal({ ...modal, seller_id: e.target.value })} disabled={!!modal.id} data-testid="invoice-seller-select">
                    <option value="">Select a company...</option>
                    {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">Invoice Date</label>
                  <input type="date" className={inputCls} value={modal.invoice_date} onChange={(e) => setModal({ ...modal, invoice_date: e.target.value })} data-testid="invoice-date-input" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Sale Agent</label>
                <input className={inputCls} placeholder="Agent name" value={modal.sale_agent} onChange={(e) => setModal({ ...modal, sale_agent: e.target.value })} data-testid="invoice-sale-agent-input" />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-medium text-white/60">Line Items</label>
                  <button onClick={addLineItem} className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-teal-300 hover:bg-teal-500/10" data-testid="invoice-add-line-item-btn"><Plus className="h-3 w-3" /> Add Line</button>
                </div>
                <div className="space-y-2">
                  {modal.line_items.map((li, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-1.5 rounded-lg border border-white/10 p-2" data-testid={`invoice-line-item-${idx}`}>
                      <input className={`${inputCls} col-span-4`} placeholder="Description" value={li.description} onChange={(e) => updateLineItem(idx, 'description', e.target.value)} data-testid={`invoice-line-description-${idx}`} />
                      <input className={`${inputCls} col-span-3`} placeholder="Booking ID/Name" value={li.booking_ref} onChange={(e) => updateLineItem(idx, 'booking_ref', e.target.value)} data-testid={`invoice-line-booking-ref-${idx}`} />
                      <input type="number" className={`${inputCls} col-span-1`} placeholder="Qty" value={li.qty} onChange={(e) => updateLineItem(idx, 'qty', e.target.value)} data-testid={`invoice-line-qty-${idx}`} />
                      <input type="number" className={`${inputCls} col-span-2`} placeholder="Rate" value={li.rate} onChange={(e) => updateLineItem(idx, 'rate', e.target.value)} data-testid={`invoice-line-rate-${idx}`} />
                      <input type="number" className={`${inputCls} col-span-1`} placeholder="Tax %" value={li.tax_percent} onChange={(e) => updateLineItem(idx, 'tax_percent', e.target.value)} data-testid={`invoice-line-tax-${idx}`} />
                      <button onClick={() => removeLineItem(idx)} className="col-span-1 flex items-center justify-center rounded-lg text-red-300 hover:bg-red-500/10" data-testid={`invoice-line-remove-${idx}`}><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-56 space-y-1 text-sm">
                  <div className="flex justify-between text-white/60"><span>Subtotal</span><span data-testid="invoice-preview-subtotal">${totals.subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-white/60"><span>Tax</span><span data-testid="invoice-preview-tax">${totals.tax_amount.toFixed(2)}</span></div>
                  <div className="flex justify-between border-t border-white/10 pt-1 font-bold"><span>Total</span><span data-testid="invoice-preview-total">${totals.total.toFixed(2)}</span></div>
                </div>
              </div>

              <textarea className={inputCls} rows={2} placeholder="Custom note / terms (shown on invoice)" value={modal.custom_note} onChange={(e) => setModal({ ...modal, custom_note: e.target.value })} data-testid="invoice-custom-note-input" />

              <div className="border-t border-white/10 pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Offline Payment Instructions</p>
                <div className="space-y-2">
                  <textarea className={inputCls} rows={2} placeholder="Bank / ACH details" value={modal.bank_info} onChange={(e) => setModal({ ...modal, bank_info: e.target.value })} data-testid="invoice-bank-info-input" />
                  <input className={inputCls} placeholder="Venmo handle" value={modal.venmo_info} onChange={(e) => setModal({ ...modal, venmo_info: e.target.value })} data-testid="invoice-venmo-info-input" />
                  <textarea className={inputCls} rows={2} placeholder="Check payment address" value={modal.check_info} onChange={(e) => setModal({ ...modal, check_info: e.target.value })} data-testid="invoice-check-info-input" />
                </div>
              </div>

              <button onClick={save} disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 py-2.5 text-sm font-semibold disabled:opacity-50" data-testid="invoice-save-btn">
                {saving ? 'Saving...' : modal.id ? 'Save Changes' : 'Create Invoice'}
              </button>

              {modal.id && (
                <button onClick={() => sendToCompany(modal)} disabled={sendingId === modal.id} className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/30 py-2.5 text-sm font-semibold text-sky-300 hover:bg-sky-500/10 disabled:opacity-50" data-testid="invoice-send-to-company-btn">
                  {sendingId === modal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send to Charter Company
                </button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {settingsOpen && (
        <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg bg-[#0b1f24] border-white/10 text-white overflow-y-auto" data-testid="invoice-settings-modal">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-white"><Settings2 className="h-5 w-5 text-teal-300" /> Invoice Defaults</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              <p className="text-xs text-white/40">Pre-fills new invoices. Editing these won't change invoices already created.</p>
              <input className={inputCls} placeholder="Default sale agent" value={invoiceSettings.default_sale_agent || ''} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, default_sale_agent: e.target.value })} data-testid="invoice-settings-sale-agent-input" />
              <textarea className={inputCls} rows={2} placeholder="Default bank / ACH details" value={invoiceSettings.default_bank_info || ''} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, default_bank_info: e.target.value })} data-testid="invoice-settings-bank-input" />
              <input className={inputCls} placeholder="Default Venmo handle" value={invoiceSettings.default_venmo_info || ''} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, default_venmo_info: e.target.value })} data-testid="invoice-settings-venmo-input" />
              <textarea className={inputCls} rows={2} placeholder="Default check payment address" value={invoiceSettings.default_check_info || ''} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, default_check_info: e.target.value })} data-testid="invoice-settings-check-input" />
              <textarea className={inputCls} rows={2} placeholder="Default custom note / terms" value={invoiceSettings.default_custom_note || ''} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, default_custom_note: e.target.value })} data-testid="invoice-settings-note-input" />
              <button onClick={saveSettings} disabled={savingSettings} className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 py-2.5 text-sm font-semibold disabled:opacity-50" data-testid="invoice-settings-save-btn">
                {savingSettings ? 'Saving...' : 'Save Defaults'}
              </button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default ToursChartersInvoices;
