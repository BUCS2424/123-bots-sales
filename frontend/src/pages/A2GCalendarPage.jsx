import React, { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

const eventFormDefault = {
  title: '',
  start_time: '',
  end_time: '',
  calendar_id: '',
  description: '',
};

export default function A2GCalendarPage() {
  const [loading, setLoading] = useState(true);
  const [calendars, setCalendars] = useState([]);
  const [events, setEvents] = useState([]);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [eventForm, setEventForm] = useState(eventFormDefault);
  const [calendarName, setCalendarName] = useState('');

  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    return { start, end };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [calRes, evRes] = await Promise.all([
        apiClient.get('/calendars'),
        apiClient.get('/calendars/events', { params: dateRange }),
      ]);
      const loadedCalendars = Array.isArray(calRes.data) ? calRes.data : [];
      setCalendars(loadedCalendars);
      setEvents(Array.isArray(evRes.data) ? evRes.data : []);
      if (!eventForm.calendar_id && loadedCalendars[0]?.id) {
        setEventForm((prev) => ({ ...prev, calendar_id: loadedCalendars[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createCalendar = async () => {
    if (!calendarName.trim()) return;
    await apiClient.post('/calendars', { name: calendarName.trim(), color: '#3b82f6', description: '', is_default: false });
    setCalendarName('');
    setShowCalendarDialog(false);
    await loadData();
  };

  const createEvent = async () => {
    if (!eventForm.title || !eventForm.start_time || !eventForm.end_time || !eventForm.calendar_id) return;
    await apiClient.post('/calendars/events', {
      title: eventForm.title,
      description: eventForm.description,
      start_time: new Date(eventForm.start_time).toISOString(),
      end_time: new Date(eventForm.end_time).toISOString(),
      calendar_id: eventForm.calendar_id,
      all_day: false,
      category_id: null,
      location: '',
      reminder_minutes: 15,
      is_recurring: false,
      recurrence: null,
      attendees: [],
      notes: '',
      priority: 'normal',
      status: 'confirmed',
      is_bill: false,
      bill_amount: null,
      bill_paid: false,
    });
    setShowEventDialog(false);
    setEventForm({ ...eventFormDefault, calendar_id: calendars[0]?.id || '' });
    await loadData();
  };

  const deleteEvent = async (id) => {
    await apiClient.delete(`/calendars/events/${id}`);
    await loadData();
  };

  return (
    <div className="space-y-4" data-testid="a2g-calendar-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="a2g-calendar-heading">Calendar</h1>
          <p className="text-sm text-gray-500" data-testid="a2g-calendar-count">{events.length} events this month</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} data-testid="a2g-calendar-refresh-button">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={() => setShowCalendarDialog(true)} data-testid="a2g-calendar-new-calendar-button">
            <Plus className="w-4 h-4 mr-2" />
            New Calendar
          </Button>
          <Button onClick={() => setShowEventDialog(true)} data-testid="a2g-calendar-new-event-button">
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4" data-testid="a2g-calendar-list-card">
        <h2 className="font-semibold mb-2">Calendars</h2>
        <div className="flex flex-wrap gap-2" data-testid="a2g-calendar-chips">
          {calendars.map((calendar) => (
            <span key={calendar.id} className="text-xs px-2 py-1 rounded-full border" data-testid={`a2g-calendar-chip-${calendar.id}`}>
              {calendar.name}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto" data-testid="a2g-events-table-wrapper">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Calendar</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-gray-500" data-testid="a2g-events-loading">Loading events...</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-gray-500" data-testid="a2g-events-empty">No events yet.</td></tr>
            ) : (
              events.map((eventItem) => (
                <tr key={eventItem.id} className="border-t" data-testid={`a2g-event-row-${eventItem.id}`}>
                  <td className="px-4 py-3" data-testid={`a2g-event-title-${eventItem.id}`}>{eventItem.title}</td>
                  <td className="px-4 py-3">{new Date(eventItem.start_time).toLocaleString()}</td>
                  <td className="px-4 py-3">{new Date(eventItem.end_time).toLocaleString()}</td>
                  <td className="px-4 py-3">{calendars.find((c) => c.id === eventItem.calendar_id)?.name || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="destructive" size="sm" onClick={() => deleteEvent(eventItem.id)} data-testid={`a2g-event-delete-${eventItem.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent data-testid="a2g-event-dialog">
          <DialogHeader><DialogTitle>New Event</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} data-testid="a2g-event-title-input" />
            </div>
            <div>
              <Label>Start</Label>
              <Input type="datetime-local" value={eventForm.start_time} onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })} data-testid="a2g-event-start-input" />
            </div>
            <div>
              <Label>End</Label>
              <Input type="datetime-local" value={eventForm.end_time} onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })} data-testid="a2g-event-end-input" />
            </div>
            <div>
              <Label>Calendar</Label>
              <select
                className="w-full h-10 rounded-md border px-3"
                value={eventForm.calendar_id}
                onChange={(e) => setEventForm({ ...eventForm, calendar_id: e.target.value })}
                data-testid="a2g-event-calendar-select"
              >
                {calendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>{calendar.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEventDialog(false)} data-testid="a2g-event-cancel-button">Cancel</Button>
              <Button onClick={createEvent} data-testid="a2g-event-save-button">Save Event</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
        <DialogContent data-testid="a2g-calendar-dialog">
          <DialogHeader><DialogTitle>New Calendar</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={calendarName} onChange={(e) => setCalendarName(e.target.value)} data-testid="a2g-calendar-name-input" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCalendarDialog(false)} data-testid="a2g-calendar-cancel-button">Cancel</Button>
              <Button onClick={createCalendar} data-testid="a2g-calendar-save-button">Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
