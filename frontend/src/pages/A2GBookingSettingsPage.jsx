import React, { useEffect, useMemo, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function A2GBookingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [linkData, setLinkData] = useState(null);
  const [meetings, setMeetings] = useState([]);

  const publicLink = useMemo(() => {
    if (!linkData?.public_url) return '';
    return `${window.location.origin}${linkData.public_url}`;
  }, [linkData]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [settingsRes, linkRes, meetingsRes] = await Promise.all([
        apiClient.get('/booking/settings'),
        apiClient.get('/booking/link'),
        apiClient.get('/booking/meetings'),
      ]);
      setSettings(settingsRes.data);
      setLinkData(linkRes.data);
      setMeetings(Array.isArray(meetingsRes.data) ? meetingsRes.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await apiClient.put('/booking/settings', {
        enabled: Boolean(settings.enabled),
        title: settings.title || 'Book a Meeting',
        description: settings.description || 'Choose an available time slot.',
        meeting_duration: Number(settings.meeting_duration || 30),
        timezone: settings.timezone || 'UTC',
        daily_start_hour: Number(settings.daily_start_hour || 9),
        daily_end_hour: Number(settings.daily_end_hour || 17),
        max_days_ahead: Number(settings.max_days_ahead || 30),
      });
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const updateMeetingStatus = async (meetingId, status) => {
    await apiClient.patch(`/booking/meetings/${meetingId}/status`, { status });
    await loadAll();
  };

  if (loading || !settings) {
    return <div data-testid="a2g-booking-loading">Loading booking settings...</div>;
  }

  return (
    <div className="space-y-4" data-testid="a2g-booking-page">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="a2g-booking-heading">Booking</h1>
          <p className="text-sm text-gray-500">Manage your public booking page and meetings.</p>
        </div>
        <Button variant="outline" onClick={loadAll} data-testid="a2g-booking-refresh-button">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-3" data-testid="a2g-booking-link-card">
        <Label>Public Booking Link</Label>
        <div className="flex gap-2">
          <Input readOnly value={publicLink} data-testid="a2g-booking-public-link" />
          <Button
            variant="outline"
            onClick={() => navigator.clipboard.writeText(publicLink)}
            data-testid="a2g-booking-copy-link-button"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4 grid md:grid-cols-2 gap-3" data-testid="a2g-booking-settings-form">
        <div>
          <Label>Title</Label>
          <Input value={settings.title || ''} onChange={(e) => setSettings({ ...settings, title: e.target.value })} data-testid="a2g-booking-title-input" />
        </div>
        <div>
          <Label>Timezone</Label>
          <Input value={settings.timezone || ''} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} data-testid="a2g-booking-timezone-input" />
        </div>
        <div>
          <Label>Meeting Duration (minutes)</Label>
          <Input type="number" value={settings.meeting_duration || 30} onChange={(e) => setSettings({ ...settings, meeting_duration: e.target.value })} data-testid="a2g-booking-duration-input" />
        </div>
        <div>
          <Label>Max Days Ahead</Label>
          <Input type="number" value={settings.max_days_ahead || 30} onChange={(e) => setSettings({ ...settings, max_days_ahead: e.target.value })} data-testid="a2g-booking-max-days-input" />
        </div>
        <div>
          <Label>Daily Start Hour (0-23)</Label>
          <Input type="number" value={settings.daily_start_hour || 9} onChange={(e) => setSettings({ ...settings, daily_start_hour: e.target.value })} data-testid="a2g-booking-start-hour-input" />
        </div>
        <div>
          <Label>Daily End Hour (0-23)</Label>
          <Input type="number" value={settings.daily_end_hour || 17} onChange={(e) => setSettings({ ...settings, daily_end_hour: e.target.value })} data-testid="a2g-booking-end-hour-input" />
        </div>
        <div className="md:col-span-2">
          <Label>Description</Label>
          <Input value={settings.description || ''} onChange={(e) => setSettings({ ...settings, description: e.target.value })} data-testid="a2g-booking-description-input" />
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <input
            id="booking-enabled"
            type="checkbox"
            checked={Boolean(settings.enabled)}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            data-testid="a2g-booking-enabled-checkbox"
          />
          <Label htmlFor="booking-enabled">Booking enabled</Label>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={saveSettings} disabled={saving} data-testid="a2g-booking-save-button">
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto" data-testid="a2g-booking-meetings-table-wrapper">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {meetings.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-gray-500" data-testid="a2g-bookings-empty">No meetings yet.</td></tr>
            ) : (
              meetings.map((meeting) => (
                <tr key={meeting.id} className="border-t" data-testid={`a2g-booking-row-${meeting.id}`}>
                  <td className="px-4 py-3" data-testid={`a2g-booking-guest-${meeting.id}`}>{meeting.guest_name} ({meeting.guest_email})</td>
                  <td className="px-4 py-3">{new Date(meeting.starts_at).toLocaleString()}</td>
                  <td className="px-4 py-3" data-testid={`a2g-booking-status-${meeting.id}`}>{meeting.status}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => updateMeetingStatus(meeting.id, 'confirmed')} data-testid={`a2g-booking-confirm-${meeting.id}`}>
                        Confirm
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => updateMeetingStatus(meeting.id, 'cancelled')} data-testid={`a2g-booking-cancel-${meeting.id}`}>
                        Cancel
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
