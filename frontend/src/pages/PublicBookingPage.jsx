import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PublicBookingPage() {
  const { bookingSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hostData, setHostData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    topic: '',
    notes: '',
  });

  const slots = useMemo(() => hostData?.available_slots || [], [hostData]);

  const loadPage = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API}/booking/public/${bookingSlug}`);
      setHostData(res.data);
      setSelectedSlot(res.data?.available_slots?.[0] || '');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Booking page not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, [bookingSlug]);

  const submitBooking = async () => {
    if (!form.guest_name || !form.guest_email || !selectedSlot) return;
    setSubmitting(true);
    try {
      const duration = Number(hostData?.settings?.meeting_duration || 30);
      const res = await axios.post(`${API}/booking/public/${bookingSlug}/book`, {
        ...form,
        starts_at: selectedSlot,
        duration_minutes: duration,
      });
      setSuccess(res.data?.meeting || null);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen p-6" data-testid="public-booking-loading">Loading booking page...</div>;
  }

  if (error) {
    return <div className="min-h-screen p-6" data-testid="public-booking-error">{error}</div>;
  }

  if (success) {
    return (
      <div className="min-h-screen p-6" data-testid="public-booking-success">
        <div className="max-w-2xl mx-auto bg-white rounded-xl border p-6 space-y-2">
          <h1 className="text-2xl font-bold">Booking Confirmed</h1>
          <p><strong>Guest:</strong> {success.guest_name}</p>
          <p><strong>Host:</strong> {hostData?.host?.name}</p>
          <p><strong>Start:</strong> {new Date(success.starts_at).toLocaleString()}</p>
          <Button onClick={() => setSuccess(null)} data-testid="public-booking-another-button">Book Another</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50" data-testid="public-booking-page">
      <div className="max-w-3xl mx-auto bg-white rounded-xl border p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="public-booking-title">{hostData?.settings?.title || 'Book a Meeting'}</h1>
          <p className="text-sm text-gray-500" data-testid="public-booking-host-name">Host: {hostData?.host?.name}</p>
          <p className="text-sm text-gray-500">{hostData?.settings?.description}</p>
        </div>

        <div>
          <Label>Available slots</Label>
          <select
            className="w-full h-10 rounded-md border px-3 mt-1"
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            data-testid="public-booking-slot-select"
          >
            {slots.slice(0, 200).map((slot) => (
              <option key={slot} value={slot}>{new Date(slot).toLocaleString()}</option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Full name</Label>
            <Input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} data-testid="public-booking-name-input" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.guest_email} onChange={(e) => setForm({ ...form, guest_email: e.target.value })} data-testid="public-booking-email-input" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} data-testid="public-booking-phone-input" />
          </div>
          <div>
            <Label>Topic</Label>
            <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} data-testid="public-booking-topic-input" />
          </div>
          <div className="md:col-span-2">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} data-testid="public-booking-notes-input" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={submitBooking} disabled={submitting} data-testid="public-booking-submit-button">
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </div>
      </div>
    </div>
  );
}
