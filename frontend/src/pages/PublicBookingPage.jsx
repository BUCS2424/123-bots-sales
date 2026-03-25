import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Video,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight,
  CalendarCheck
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PublicBookingPage = () => {
  const { bookingSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hostInfo, setHostInfo] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    duration: 30,
    notes: "",
    location_type: "online",
    use_saysme: true,
    use_other: false,
    other_meeting_text: "",
    physical_address: ""
  });

  // Generate the meeting room name based on host name and meeting title
  const generateRoomName = () => {
    if (!hostInfo) return "";
    const hostName = (hostInfo.user_name || "host").toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const timestamp = Date.now().toString(36);
    return `${hostName}-meeting-${timestamp}`;
  };

  const [generatedRoomName, setGeneratedRoomName] = useState("");

  // Generate room name when video meeting is requested
  useEffect(() => {
    if (hostInfo && formData.location_type === "online" && formData.use_saysme && !generatedRoomName) {
      setGeneratedRoomName(generateRoomName());
    }
  }, [formData.location_type, formData.use_saysme, hostInfo]);

  const getVideoMeetingUrl = () => {
    if (!hostInfo || !generatedRoomName) return "";
    const baseUrl = hostInfo.video_meet_base_url || "https://meet.saysme.org";
    return `${baseUrl}/${generatedRoomName}`;
  };

  useEffect(() => {
    loadHostInfo();
  }, [bookingSlug]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadHostInfo = async () => {
    try {
      const response = await fetch(`${API}/booking/public/${bookingSlug}`);
      if (!response.ok) {
        throw new Error("Booking page not found");
      }
      const data = await response.json();
      setHostInfo(data);
      setFormData(prev => ({
        ...prev,
        duration: data.default_length || 30,
        location_type: data.default_location_type || "online",
        physical_address: data.default_location_type === "physical" ? (data.physical_address || "") : "",
        other_meeting_text: data.default_location_type === "online" ? (data.other_meeting_url || "") : "",
      }));
      setGeneratedRoomName(generateRoomName());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async (date) => {
    setLoadingSlots(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const response = await fetch(`${API}/booking/public/${bookingSlug}/slots/${dateStr}`);
      const data = await response.json();
      setAvailableSlots(data.slots || []);
    } catch (err) {
      toast.error("Failed to load available slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const isDateAvailable = (date) => {
    if (!hostInfo) return false;
    const dayOfWeek = date.getDay();
    const availability = hostInfo.availability || [];
    const dayConfig = availability.find(a => a.day === dayOfWeek);
    
    if (!dayConfig || !dayConfig.enabled) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + (hostInfo.advance_days || 30));
    
    return date >= today && date <= maxDate;
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (formData.location_type === "physical" && !formData.physical_address.trim()) {
      toast.error("Please enter physical address");
      return;
    }
    if (formData.location_type === "online" && !formData.use_saysme && !formData.use_other) {
      toast.error("Select meet.saysme.org or Other Meeting URL");
      return;
    }
    if (formData.location_type === "online" && formData.use_saysme && !generatedRoomName.trim()) {
      toast.error("Please enter secure room name");
      return;
    }
    if (formData.location_type === "online" && formData.use_other && !formData.other_meeting_text.trim()) {
      toast.error("Please enter other meeting details");
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API}/booking/public/${bookingSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          date: selectedDate.toISOString().split("T")[0],
          time: selectedSlot.time,
          duration: formData.duration,
          notes: formData.notes || null,
          location_type: formData.location_type,
          use_saysme: formData.location_type === "online" ? formData.use_saysme : false,
          use_other: formData.location_type === "online" ? formData.use_other : false,
          other_meeting_text: formData.location_type === "online" ? formData.other_meeting_text : "",
          physical_address: formData.location_type === "physical" ? formData.physical_address : "",
          custom_room_name: formData.location_type === "online" && formData.use_saysme ? generatedRoomName : null
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Booking failed");
      }
      
      const result = await response.json();
      setBookingResult(result);
      setStep(3);
      toast.success("Meeting booked successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCalendar = () => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const weeks = [];
    let currentWeek = [];
    let date = new Date(startDate);
    
    while (date <= lastDay || currentWeek.length > 0) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
        if (date > lastDay) break;
      }
      currentWeek.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(new Date(date));
        date.setDate(date.getDate() + 1);
      }
      weeks.push(currentWeek);
    }

    return (
      <div className="space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => {
              const newDate = new Date(currentMonth);
              newDate.setMonth(newDate.getMonth() - 1);
              setCurrentMonth(newDate);
            }}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button 
            onClick={() => {
              const newDate = new Date(currentMonth);
              newDate.setMonth(newDate.getMonth() + 1);
              setCurrentMonth(newDate);
            }}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
            const isAvailable = isDateAvailable(day);
            
            return (
              <button
                key={index}
                disabled={!isAvailable || !isCurrentMonth}
                onClick={() => {
                  setSelectedDate(day);
                  setSelectedSlot(null);
                }}
                className={`
                  relative p-3 text-sm font-medium rounded-xl transition-all duration-200
                  ${!isCurrentMonth ? "text-slate-300 dark:text-slate-700 cursor-default" :
                    isSelected ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 scale-105" :
                    isToday ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold" :
                    isAvailable ? "bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer" :
                    "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  }
                `}
              >
                {day.getDate()}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <CalendarIcon className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Loading booking page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-red-950/20 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Page Not Found</h1>
          <p className="text-slate-500 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-indigo-500/5 to-violet-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-xl shadow-indigo-500/30 mb-6">
            <CalendarCheck className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
            Book a Meeting
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            with <span className="font-semibold text-indigo-600 dark:text-indigo-400">{hostInfo?.user_name}</span>
          </p>
        </div>

        {/* Step 1: Select Date & Time */}
        {step === 1 && (
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Calendar Section */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">Select a Date</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Choose your preferred day</p>
                  </div>
                </div>
                
                {renderCalendar()}
              </div>
            </div>
            
            {/* Time Slots Section */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 md:p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">Available Times</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedDate 
                        ? selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
                        : "Select a date first"
                      }
                    </p>
                  </div>
                </div>
                
                {!selectedDate ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <CalendarIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Pick a date to see available times</p>
                  </div>
                ) : loadingSlots ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                    <p className="text-slate-500">Loading times...</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 text-amber-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">No available slots for this date</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try selecting another day</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 -mr-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedSlot(slot)}
                        className={`
                          w-full p-4 rounded-xl border-2 text-left font-medium transition-all duration-200
                          ${selectedSlot?.time === slot.time
                            ? "bg-gradient-to-r from-indigo-500 to-violet-500 border-transparent text-white shadow-lg shadow-indigo-500/30"
                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span>{slot.display}</span>
                          {selectedSlot?.time === slot.time && (
                            <Check className="w-5 h-5" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {selectedSlot && (
                  <Button 
                    onClick={() => setStep(2)}
                    className="w-full mt-6 h-12 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg shadow-indigo-500/30 rounded-xl"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Enter Details */}
        {step === 2 && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 md:p-8">
              {/* Selected Time Summary */}
              <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-2xl p-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                    <CalendarCheck className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {selectedSlot?.display}
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Your Details</h2>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      className="pl-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      placeholder="John Smith"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      className="pl-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Phone Number <span className="text-slate-400">(optional)</span></Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      className="pl-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Meeting Duration</Label>
                  <Select
                    value={String(formData.duration)}
                    onValueChange={(v) => setFormData({ ...formData, duration: parseInt(v) })}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(hostInfo?.meeting_lengths || [15, 30, 45, 60]).map(len => (
                        <SelectItem key={len} value={String(len)}>{len} minutes</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4" data-testid="public-booking-location-section">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Location Type</Label>
                    <Select
                      value={formData.location_type}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          location_type: value,
                          use_saysme: value === "online",
                          use_other: false,
                        })
                      }
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" data-testid="public-booking-location-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physical">Physical Location</SelectItem>
                        <SelectItem value="online">Online Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.location_type === "physical" && (
                    <div className="space-y-2" data-testid="public-booking-physical-address-wrap">
                      <Label className="text-slate-700 dark:text-slate-300">Physical Address</Label>
                      <Input
                        className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        placeholder="Enter full address"
                        value={formData.physical_address}
                        onChange={(e) => setFormData({ ...formData, physical_address: e.target.value })}
                        data-testid="public-booking-physical-address-input"
                      />
                    </div>
                  )}

                  {formData.location_type === "online" && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4" data-testid="public-booking-online-options">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.use_saysme}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              use_saysme: e.target.checked,
                              use_other: e.target.checked ? false : formData.use_other,
                            })
                          }
                          data-testid="public-booking-use-saysme-checkbox"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Use https://meet.saysme.org/</span>
                      </label>

                      {formData.use_saysme && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Secure Room Name</Label>
                            <Input
                              value={generatedRoomName}
                              onChange={(e) => setGeneratedRoomName(e.target.value)}
                              placeholder="melvin-team-sync"
                              data-testid="public-booking-room-name-input"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Meeting URL</Label>
                            <Input
                              readOnly
                              value={getVideoMeetingUrl()}
                              data-testid="public-booking-room-url-preview"
                            />
                          </div>
                        </div>
                      )}

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.use_other}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              use_other: e.target.checked,
                              use_saysme: e.target.checked ? false : formData.use_saysme,
                            })
                          }
                          data-testid="public-booking-use-other-checkbox"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Other Meeting URL</span>
                      </label>

                      {formData.use_other && (
                        <div className="space-y-2">
                          <Label>Other Meeting Details</Label>
                          <Input
                            value={formData.other_meeting_text}
                            onChange={(e) => setFormData({ ...formData, other_meeting_text: e.target.value })}
                            placeholder="Paste custom meeting details"
                            data-testid="public-booking-other-details-input"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Additional Notes <span className="text-slate-400">(optional)</span></Label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                    <Textarea
                      className="pl-12 pt-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 min-h-[100px]"
                      placeholder="Topics to discuss, questions, or any other details..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)} 
                  className="flex-1 h-12 rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting} 
                  className="flex-1 h-12 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg shadow-indigo-500/30 rounded-xl"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="w-4 h-4 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && bookingResult && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 md:p-10 text-center">
              {/* Success Animation */}
              <div className="relative inline-block mb-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <Check className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">You're All Set!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">
                A confirmation email has been sent to <span className="font-medium text-slate-700 dark:text-slate-300">{formData.email}</span>
              </p>
              
              {/* Booking Details Card */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 text-left space-y-4 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-indigo-500" />
                    <span className="text-slate-600 dark:text-slate-400">Date</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{bookingResult.details?.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    <span className="text-slate-600 dark:text-slate-400">Time</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{bookingResult.details?.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-indigo-500" />
                    <span className="text-slate-600 dark:text-slate-400">Host</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{bookingResult.details?.host_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    <span className="text-slate-600 dark:text-slate-400">Duration</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{bookingResult.details?.duration} minutes</span>
                </div>
              </div>
              
              {/* Video Link */}
              {bookingResult.video_link && (
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl p-6 mb-8">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Video className="w-5 h-5 text-violet-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">Video Meeting Link</span>
                  </div>
                  <a 
                    href={bookingResult.video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline font-medium break-all"
                  >
                    {bookingResult.video_link}
                  </a>
                </div>
              )}
              
              <Button 
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setSelectedDate(null);
                  setSelectedSlot(null);
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    duration: hostInfo?.default_length || 30,
                    notes: "",
                    location_type: hostInfo?.default_location_type || "online",
                    use_saysme: true,
                    use_other: false,
                    other_meeting_text: "",
                    physical_address: "",
                  });
                  setGeneratedRoomName(generateRoomName());
                  setBookingResult(null);
                }}
                className="h-12 px-8 rounded-xl"
              >
                Book Another Meeting
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicBookingPage;
