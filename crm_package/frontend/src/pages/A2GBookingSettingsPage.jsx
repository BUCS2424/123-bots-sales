import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  Copy, 
  Check, 
  Settings2, 
  Video,
  Link2,
  Plus,
  Trash2,
  Users,
  Mail,
  Phone,
  Send,
  X,
  Loader2,
  CalendarCheck,
  CalendarX,
  ChevronRight,
  Sparkles,
  Globe,
  Timer,
  CalendarDays
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { toast } from "sonner";
import { apiClient } from "../lib/apiClient";

const DAYS = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h < 12 ? "AM" : "PM";
    const display = `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
    TIME_OPTIONS.push({ value: time, label: display });
  }
}

// Booking Link Hero Card Component
const BookingLinkCard = ({ bookingLink, onCopy, copied }) => (
  <div className="relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/50 dark:from-slate-900 dark:via-slate-900/80 dark:to-indigo-950/30 p-8 shadow-sm">
    {/* Decorative elements */}
    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-500/5 to-violet-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
    
    <div className="relative flex flex-col md:flex-row md:items-center gap-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
        <Link2 className="w-7 h-7" />
      </div>
      
      <div className="flex-1 space-y-1">
        <h2 className="font-manrope text-xl font-semibold text-slate-900 dark:text-white">
          Your Booking Link
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Share this link with anyone to let them schedule time with you
        </p>
      </div>
    </div>
    
    <div className="relative mt-6 flex items-center gap-3">
      <div className="flex-1 relative">
        <Input 
          value={bookingLink} 
          readOnly 
          className="font-mono text-sm pr-24 bg-white/70 dark:bg-black/20 border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500 h-12 rounded-xl"
        />
        <Button 
          onClick={onCopy} 
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-4 rounded-lg transition-all duration-300 ${
            copied 
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1.5" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  </div>
);

// Availability Row Component
const AvailabilityRow = ({ day, slot, onToggle, onTimeChange }) => {
  const isEnabled = slot?.enabled;
  
  return (
    <div className={`group flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 ${
      isEnabled 
        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm' 
        : 'bg-slate-50/50 dark:bg-slate-900/50 border-transparent hover:border-slate-200 dark:hover:border-slate-800'
    }`}>
      <Switch
        checked={isEnabled}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-indigo-500"
      />
      
      <div className={`w-28 font-medium transition-colors ${
        isEnabled ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
      }`}>
        {day.label}
      </div>
      
      {isEnabled ? (
        <div className="flex items-center gap-3 flex-1">
          <Select
            value={slot.start_time}
            onValueChange={(v) => onTimeChange("start_time", v)}
          >
            <SelectTrigger className="w-32 h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <span className="text-slate-400">to</span>
          
          <Select
            value={slot.end_time}
            onValueChange={(v) => onTimeChange("end_time", v)}
          >
            <SelectTrigger className="w-32 h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="flex-1 text-sm text-slate-400 dark:text-slate-500 italic">
          Unavailable
        </div>
      )}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const styles = {
    confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
    cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400",
    pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
  };
  
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status] || styles.pending}`}>
      {status === 'confirmed' && <Check className="w-3 h-3 mr-1" />}
      {status === 'cancelled' && <X className="w-3 h-3 mr-1" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Booking Card Component
const BookingCard = ({ booking, onCancel }) => (
  <div className={`group relative rounded-xl border p-5 transition-all duration-200 hover:shadow-md ${
    booking.status === 'cancelled' 
      ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60' 
      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
  }`}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-900 dark:text-white">{booking.guest_name}</h4>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{booking.guest_email}</p>
          {booking.guest_phone && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{booking.guest_phone}</p>
          )}
        </div>
      </div>
      
      <div className="text-right">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
          <CalendarDays className="w-4 h-4 text-indigo-500" />
          {booking.date}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
          <Clock className="w-3.5 h-3.5" />
          {booking.time} ({booking.duration} min)
        </div>
      </div>
    </div>
    
    {booking.notes && (
      <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
        {booking.notes}
      </div>
    )}
    
    {booking.video_link && (
      <a 
        href={booking.video_link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        <Video className="w-4 h-4" />
        Join Video Meeting
        <ChevronRight className="w-3 h-3" />
      </a>
    )}
    
    {booking.status !== 'cancelled' && (
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCancel(booking.id)}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <CalendarX className="w-4 h-4 mr-1.5" />
          Cancel Booking
        </Button>
      </div>
    )}
  </div>
);

// Empty State Component
const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
      <Icon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
    </div>
    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{description}</p>
  </div>
);

const BookingSettingsPage = () => {
  const [searchParams] = useSearchParams();
  const managedUserId = searchParams.get("userId") || "";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: true,
    availability: [],
    meeting_lengths: [15, 30, 45, 60],
    default_length: 30,
    buffer_minutes: 15,
    advance_days: 30,
    timezone: "America/New_York",
    video_meet_enabled: true,
    video_meet_base_url: "https://meet.saysme.org",
    default_location_type: "online",
    physical_address: "",
    other_meeting_url: ""
  });
  const [bookingLink, setBookingLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [managedUserMeta, setManagedUserMeta] = useState(null);
  
  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    title: "",
    date: "",
    time: "09:00",
    duration: 30,
    description: "",
    location_type: "online",
    use_saysme: true,
    use_other: false,
    other_meeting_text: "",
    custom_room_name: "",
    physical_address: "",
    invitees: []
  });
  const [inviteeInput, setInviteeInput] = useState({ type: "email", value: "" });
  const [sendingInvite, setSendingInvite] = useState(false);
  const requestParams = managedUserId ? { params: { user_id: managedUserId } } : {};

  const generateSecureRoomName = () => {
    const baseName = (managedUserMeta?.name || "meeting").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `${baseName}-${Date.now().toString(36).slice(-5)}`;
  };

  useEffect(() => {
    loadSettings();
    loadBookingLink();
    loadBookings();
    loadContacts();
    if (managedUserId) {
      loadManagedUserMeta();
    }
  }, []);

  const loadManagedUserMeta = async () => {
    try {
      const response = await apiClient.get("/booking/admin/users");
      const selected = (response.data || []).find((item) => item.id === managedUserId);
      setManagedUserMeta(selected || null);
    } catch (error) {
      console.error("Failed to load managed user meta", error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await apiClient.get("/booking/settings", requestParams);
      setSettings(response.data);
    } catch (error) {
      toast.error("Failed to load booking settings");
    } finally {
      setLoading(false);
    }
  };

  const loadBookingLink = async () => {
    try {
      const response = await apiClient.get("/booking/link", requestParams);
      setBookingLink(response.data.booking_url);
    } catch (error) {
      console.error("Failed to load booking link:", error);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await apiClient.get("/booking/my-bookings", requestParams);
      setBookings(response.data);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    }
  };

  const loadContacts = async () => {
    try {
      const response = await apiClient.get("/contacts");
      setContacts(response.data);
    } catch (error) {
      console.error("Failed to load contacts:", error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await apiClient.post("/booking/settings", settings, requestParams);
      toast.success("Settings saved successfully");
      loadBookingLink();
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(bookingLink);
    setCopied(true);
    toast.success("Booking link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const updateAvailability = (dayIndex, field, value) => {
    setSettings(prev => ({
      ...prev,
      availability: prev.availability.map((slot) => 
        slot.day === dayIndex ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const toggleDayAvailability = (dayValue) => {
    const existingSlot = settings.availability.find(s => s.day === dayValue);
    if (existingSlot) {
      updateAvailability(dayValue, "enabled", !existingSlot.enabled);
    } else {
      setSettings(prev => ({
        ...prev,
        availability: [...prev.availability, { 
          day: dayValue, 
          start_time: "09:00", 
          end_time: "17:00", 
          enabled: true 
        }]
      }));
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      await apiClient.delete(`/booking/${bookingId}`);
      toast.success("Booking cancelled");
      loadBookings();
    } catch (error) {
      toast.error("Failed to cancel booking");
    }
  };

  const addInvitee = () => {
    if (!inviteeInput.value.trim()) return;
    
    setInviteForm(prev => ({
      ...prev,
      invitees: [...prev.invitees, { ...inviteeInput }]
    }));
    setInviteeInput({ type: "email", value: "" });
  };

  const removeInvitee = (index) => {
    setInviteForm(prev => ({
      ...prev,
      invitees: prev.invitees.filter((_, i) => i !== index)
    }));
  };

  const getInviteMeetingUrl = () => {
    const baseUrl = settings.video_meet_base_url || "https://meet.saysme.org";
    const roomName = inviteForm.custom_room_name?.trim();
    if (!roomName) return "";
    return `${baseUrl}/${roomName}`;
  };

  const sendInvites = async () => {
    if (!inviteForm.title || !inviteForm.date || !inviteForm.time) {
      toast.error("Please fill in meeting title, date, and time");
      return;
    }
    if (inviteForm.invitees.length === 0) {
      toast.error("Please add at least one invitee");
      return;
    }
    if (inviteForm.location_type === "online" && !inviteForm.use_saysme && !inviteForm.use_other) {
      toast.error("Select meet.saysme.org or Other for online meeting");
      return;
    }
    if (inviteForm.location_type === "online" && inviteForm.use_saysme && !inviteForm.custom_room_name.trim()) {
      toast.error("Please enter a secure room name");
      return;
    }
    if (inviteForm.location_type === "online" && inviteForm.use_other && !inviteForm.other_meeting_text.trim()) {
      toast.error("Please enter custom meeting details");
      return;
    }
    if (inviteForm.location_type === "physical" && !inviteForm.physical_address.trim()) {
      toast.error("Please enter physical address");
      return;
    }
    
    setSendingInvite(true);
    try {
      const response = await apiClient.post("/booking/invite", inviteForm, requestParams);
      const results = response.data.results;
      
      if (results.sent.length > 0) {
        toast.success(`Invitations sent to ${results.sent.length} recipient(s)`);
      }
      if (results.failed.length > 0) {
        toast.warning(`Failed to send to ${results.failed.length} recipient(s)`);
      }
      
      if (response.data.video_link) {
        toast.info(`Video link: ${response.data.video_link}`, { duration: 10000 });
      }
      
      setShowInviteModal(false);
      setInviteForm({
        title: "",
        date: "",
        time: "09:00",
        duration: 30,
        description: "",
        location_type: "online",
        use_saysme: true,
        use_other: false,
        other_meeting_text: "",
        custom_room_name: "",
        physical_address: "",
        invitees: []
      });
    } catch (error) {
      toast.error("Failed to send invitations");
    } finally {
      setSendingInvite(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-500">Loading your booking settings...</p>
        </div>
      </div>
    );
  }

  const activeBookings = bookings.filter(b => b.status !== 'cancelled');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8" data-testid="booking-settings-page">
      {managedUserId && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3" data-testid="booking-managed-user-banner">
          <p className="text-sm font-medium text-blue-800">
            Managing booking settings for: {managedUserMeta?.name || managedUserMeta?.email || managedUserId}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-manrope text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white">
              <CalendarCheck className="w-5 h-5" />
            </span>
            Meeting Scheduler
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Configure your availability and let others book time with you
          </p>
        </div>
        <Button 
          onClick={() => {
            setInviteForm((prev) => ({
              ...prev,
              custom_room_name: prev.custom_room_name || generateSecureRoomName(),
            }));
            setShowInviteModal(true);
          }}
          className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 h-11 px-5"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Create Meeting
        </Button>
      </div>

      {/* Booking Link Card */}
      <BookingLinkCard 
        bookingLink={bookingLink} 
        onCopy={copyLink} 
        copied={copied} 
      />

      {/* Tabs */}
      <Tabs defaultValue="availability" className="space-y-6">
        <TabsList className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-slate-500 dark:text-slate-400">
          <TabsTrigger 
            value="availability" 
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-white"
          >
            <Clock className="w-4 h-4 mr-2" />
            Availability
          </TabsTrigger>
          <TabsTrigger 
            value="settings"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-white"
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger 
            value="bookings"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            Bookings
            {activeBookings.length > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-xs text-white">
                {activeBookings.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-manrope text-lg font-semibold text-slate-900 dark:text-white">Weekly Schedule</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Set your available hours for each day</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Accepting Bookings</span>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              {DAYS.map(day => {
                const daySlot = settings.availability.find(s => s.day === day.value) || {
                  day: day.value,
                  start_time: "09:00",
                  end_time: "17:00",
                  enabled: false
                };
                
                return (
                  <AvailabilityRow
                    key={day.value}
                    day={day}
                    slot={daySlot}
                    onToggle={() => toggleDayAvailability(day.value)}
                    onTimeChange={(field, value) => updateAvailability(day.value, field, value)}
                  />
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Meeting Options */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-manrope text-lg font-semibold text-slate-900 dark:text-white">Meeting Options</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Configure duration and buffer times</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Default Duration</Label>
                <Select
                  value={String(settings.default_length)}
                  onValueChange={(v) => setSettings({ ...settings, default_length: parseInt(v) })}
                >
                  <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.meeting_lengths.map(len => (
                      <SelectItem key={len} value={String(len)}>{len} minutes</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Buffer Between Meetings</Label>
                <Select
                  value={String(settings.buffer_minutes)}
                  onValueChange={(v) => setSettings({ ...settings, buffer_minutes: parseInt(v) })}
                >
                  <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No buffer</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Advance Booking Window</Label>
                <Select
                  value={String(settings.advance_days)}
                  onValueChange={(v) => setSettings({ ...settings, advance_days: parseInt(v) })}
                >
                  <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="14">2 weeks</SelectItem>
                    <SelectItem value="30">1 month</SelectItem>
                    <SelectItem value="60">2 months</SelectItem>
                    <SelectItem value="90">3 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Available Durations</Label>
                <div className="flex flex-wrap gap-2">
                  {[15, 30, 45, 60, 90, 120].map(len => (
                    <button
                      key={len}
                      onClick={() => {
                        const current = settings.meeting_lengths;
                        if (current.includes(len)) {
                          if (current.length > 1) {
                            setSettings({ ...settings, meeting_lengths: current.filter(l => l !== len) });
                          }
                        } else {
                          setSettings({ ...settings, meeting_lengths: [...current, len].sort((a, b) => a - b) });
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        settings.meeting_lengths.includes(len)
                          ? "bg-indigo-500 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {len}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Video Meeting Settings */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-manrope text-lg font-semibold text-slate-900 dark:text-white">Video Meetings</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Auto-generate video links for bookings</p>
                </div>
              </div>
              <Switch
                checked={settings.video_meet_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, video_meet_enabled: checked })}
                className="data-[state=checked]:bg-violet-500"
              />
            </div>
            
            {settings.video_meet_enabled && (
              <div className="mt-6 space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Video Meeting Base URL</Label>
                <Input
                  value={settings.video_meet_base_url}
                  onChange={(e) => setSettings({ ...settings, video_meet_base_url: e.target.value })}
                  placeholder="https://meet.saysme.org"
                  className="h-11 bg-slate-50 dark:bg-slate-800"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Rooms: {settings.video_meet_base_url}/your-name-meeting-title
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm space-y-4" data-testid="booking-location-defaults-card">
            <div>
              <h3 className="font-manrope text-lg font-semibold text-slate-900 dark:text-white">Location Defaults</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Default location type used for new meetings</p>
            </div>

            <div className="space-y-2">
              <Label>Location Type</Label>
              <Select
                value={settings.default_location_type || "online"}
                onValueChange={(value) => setSettings({ ...settings, default_location_type: value })}
              >
                <SelectTrigger className="h-11" data-testid="booking-default-location-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">Physical Location</SelectItem>
                  <SelectItem value="online">Online Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.default_location_type === "physical" && (
              <div className="space-y-2">
                <Label>Physical Address</Label>
                <Input
                  value={settings.physical_address || ""}
                  onChange={(e) => setSettings({ ...settings, physical_address: e.target.value })}
                  placeholder="Enter full address"
                  className="h-11"
                  data-testid="booking-default-physical-address-input"
                />
              </div>
            )}

            {settings.default_location_type === "online" && (
              <div className="space-y-2">
                <Label>Other Meeting Default (optional)</Label>
                <Input
                  value={settings.other_meeting_url || ""}
                  onChange={(e) => setSettings({ ...settings, other_meeting_url: e.target.value })}
                  placeholder="Custom online meeting details"
                  className="h-11"
                  data-testid="booking-default-other-meeting-input"
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          {bookings.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
              <EmptyState 
                icon={Calendar}
                title="No bookings yet"
                description="Share your booking link to start receiving meeting requests"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {activeBookings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-emerald-500" />
                    Upcoming ({activeBookings.length})
                  </h3>
                  {activeBookings.map(booking => (
                    <BookingCard key={booking.id} booking={booking} onCancel={cancelBooking} />
                  ))}
                </div>
              )}
              
              {cancelledBookings.length > 0 && (
                <div className="space-y-3 pt-4">
                  <h3 className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <CalendarX className="w-5 h-5" />
                    Cancelled ({cancelledBookings.length})
                  </h3>
                  {cancelledBookings.map(booking => (
                    <BookingCard key={booking.id} booking={booking} onCancel={cancelBooking} />
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Sticky Save Button */}
      <div className="sticky bottom-6 flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 h-11 px-6"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-manrope text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Create Meeting
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>Meeting Title</Label>
              <Input
                value={inviteForm.title}
                onChange={(e) => setInviteForm({ ...inviteForm, title: e.target.value })}
                placeholder="Weekly standup"
                className="h-11"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={inviteForm.date}
                  onChange={(e) => setInviteForm({ ...inviteForm, date: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Select
                  value={inviteForm.time}
                  onValueChange={(v) => setInviteForm({ ...inviteForm, time: v })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={String(inviteForm.duration)}
                  onValueChange={(v) => setInviteForm({ ...inviteForm, duration: parseInt(v) })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location Type</Label>
                <Select
                  value={inviteForm.location_type}
                  onValueChange={(value) =>
                    setInviteForm({
                      ...inviteForm,
                      location_type: value,
                      use_saysme: value === "online",
                      use_other: false,
                    })
                  }
                >
                  <SelectTrigger className="h-11" data-testid="create-meeting-location-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Physical Location</SelectItem>
                    <SelectItem value="online">Online Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {inviteForm.location_type === "physical" && (
              <div className="space-y-2" data-testid="create-meeting-physical-address-wrap">
                <Label>Physical Address</Label>
                <Input
                  value={inviteForm.physical_address}
                  onChange={(e) => setInviteForm({ ...inviteForm, physical_address: e.target.value })}
                  placeholder="Enter full address"
                  className="h-11"
                  data-testid="create-meeting-physical-address-input"
                />
              </div>
            )}

            {inviteForm.location_type === "online" && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4" data-testid="create-meeting-online-options-wrap">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inviteForm.use_saysme}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        use_saysme: e.target.checked,
                        use_other: e.target.checked ? false : inviteForm.use_other,
                      })
                    }
                    data-testid="create-meeting-use-saysme-checkbox"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Use https://meet.saysme.org/</span>
                </label>

                {inviteForm.use_saysme && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Secure Room Name</Label>
                      <Input
                        value={inviteForm.custom_room_name}
                        onChange={(e) => setInviteForm({ ...inviteForm, custom_room_name: e.target.value })}
                        placeholder="melvin-team-sync"
                        data-testid="create-meeting-room-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Meeting URL</Label>
                      <Input
                        readOnly
                        value={getInviteMeetingUrl()}
                        data-testid="create-meeting-room-url-preview"
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inviteForm.use_other}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        use_other: e.target.checked,
                        use_saysme: e.target.checked ? false : inviteForm.use_saysme,
                      })
                    }
                    data-testid="create-meeting-use-other-checkbox"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Other Meeting URL</span>
                </label>

                {inviteForm.use_other && (
                  <div className="space-y-2">
                    <Label>Other Meeting Details</Label>
                    <Input
                      value={inviteForm.other_meeting_text}
                      onChange={(e) => setInviteForm({ ...inviteForm, other_meeting_text: e.target.value })}
                      placeholder="Zoom link, Teams room, call-in details"
                      data-testid="create-meeting-other-detail-input"
                    />
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Description <span className="text-slate-400">(optional)</span></Label>
              <Textarea
                value={inviteForm.description}
                onChange={(e) => setInviteForm({ ...inviteForm, description: e.target.value })}
                placeholder="Meeting agenda..."
                rows={2}
              />
            </div>
            
            <div className="space-y-3">
              <Label>Invitees</Label>
              <div className="flex gap-2">
                <Select
                  value={inviteeInput.type}
                  onValueChange={(v) => setInviteeInput({ ...inviteeInput, type: v })}
                >
                  <SelectTrigger className="w-28 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </div>
                    </SelectItem>
                    <SelectItem value="sms">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        SMS
                      </div>
                    </SelectItem>
                    <SelectItem value="contact">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Contact
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {inviteeInput.type === "contact" ? (
                  <Select
                    value={inviteeInput.value}
                    onValueChange={(v) => setInviteeInput({ ...inviteeInput, value: v })}
                  >
                    <SelectTrigger className="flex-1 h-11">
                      <SelectValue placeholder="Select contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="flex-1 h-11"
                    placeholder={inviteeInput.type === "email" ? "email@example.com" : "+1234567890"}
                    value={inviteeInput.value}
                    onChange={(e) => setInviteeInput({ ...inviteeInput, value: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && addInvitee()}
                  />
                )}
                
                <Button variant="outline" size="icon" onClick={addInvitee} className="h-11 w-11">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {inviteForm.invitees.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {inviteForm.invitees.map((inv, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-full text-sm"
                    >
                      {inv.type === "email" && <Mail className="w-3.5 h-3.5" />}
                      {inv.type === "sms" && <Phone className="w-3.5 h-3.5" />}
                      {inv.type === "contact" && <Users className="w-3.5 h-3.5" />}
                      <span>{inv.type === "contact" ? contacts.find(c => c.id === inv.value)?.name : inv.value}</span>
                      <button onClick={() => removeInvitee(index)} className="ml-1 hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={sendInvites} 
              disabled={sendingInvite}
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              {sendingInvite ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invites
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingSettingsPage;
