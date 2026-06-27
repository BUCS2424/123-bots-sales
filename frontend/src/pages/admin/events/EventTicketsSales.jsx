import React, { useEffect, useState } from 'react';
import { Ticket, Loader2, TrendingUp } from 'lucide-react';
import { eventApi, fmtMoneyFull } from './eventApi';
import { toast } from '../../../hooks/use-toast';

const EventTicketsSales = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventApi.listEvents()
      .then((r) => setEvents(r.data || []))
      .catch(() => toast({ title: 'Error', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const rows = [];
  let totalSold = 0, totalRevenue = 0, totalCapacity = 0;
  events.forEach((ev) => {
    (ev.ticket_types || []).forEach((t) => {
      const sold = t.sold || 0;
      const rev = sold * (t.price || 0);
      totalSold += sold; totalRevenue += rev;
      rows.push({ event: ev.title, status: ev.status, type: t.name || 'Ticket', price: t.price || 0, qty: t.quantity || 0, sold, rev });
    });
    totalCapacity += ev.capacity || 0;
  });

  return (
    <div className="-m-4 min-h-screen bg-[#0b0712] p-5 text-white lg:-m-6 lg:p-8" data-testid="tickets-sales-page">
      <h1 className="mb-1 text-2xl font-black">Tickets & Sales</h1>
      <p className="mb-6 text-sm text-white/40">Ticket type performance across all events</p>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-purple-400" /></div> : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#150f22] p-5" data-testid="ts-total-sold">
              <p className="text-xs uppercase text-white/50">Total Tickets Sold</p>
              <p className="mt-1 text-3xl font-bold">{totalSold.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#150f22] p-5" data-testid="ts-total-revenue">
              <p className="text-xs uppercase text-white/50">Gross Ticket Revenue</p>
              <p className="mt-1 text-3xl font-bold text-emerald-300">{fmtMoneyFull(totalRevenue)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#150f22] p-5" data-testid="ts-capacity">
              <p className="text-xs uppercase text-white/50">Total Capacity</p>
              <p className="mt-1 text-3xl font-bold">{totalCapacity.toLocaleString()}</p>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#150f22] py-16 text-center text-white/40" data-testid="ts-empty">
              <Ticket className="mx-auto mb-3 h-10 w-10 text-white/20" />No ticket types configured yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#150f22]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase text-white/40">
                      <th className="p-4">Event</th><th className="p-4">Ticket Type</th><th className="p-4">Price</th>
                      <th className="p-4">Sold / Qty</th><th className="p-4 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]" data-testid={`ts-row-${i}`}>
                        <td className="p-4 font-medium">{r.event}</td>
                        <td className="p-4 text-white/70">{r.type}</td>
                        <td className="p-4 text-white/70">{fmtMoneyFull(r.price)}</td>
                        <td className="p-4 text-white/70">{r.sold} / {r.qty || '∞'}</td>
                        <td className="p-4 text-right font-semibold text-emerald-300">{fmtMoneyFull(r.rev)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <p className="mt-4 flex items-center gap-2 text-xs text-white/40"><TrendingUp className="h-3.5 w-3.5" /> Revenue reflects checked-in & valid ticket sales. Online ticket purchasing (PayPal) arrives in Phase 2.</p>
        </>
      )}
    </div>
  );
};

export default EventTicketsSales;
