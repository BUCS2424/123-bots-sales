import React, { useState, useEffect, useCallback } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Tag,
  Repeat,
  Trash2,
  Edit,
  X,
  Check,
  Bell,
  MoreVertical,
  Grid3X3,
  List,
  Settings2,
  Sun,
  Moon,
  Sparkles,
  RefreshCw,
  Link2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";
import { apiClient, useAuth } from "../App";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DEFAULT_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
];

const CalendarPage = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [calendars, setCalendars] = useState([]);
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedCalendars, setSelectedCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Event form state
  const [eventForm, setEventForm] = useState({
    title: "", description: "", start_time: "", end_time: "",
    all_day: false, calendar_id: "", category_id: "", location: "",
    reminder_minutes: 15, is_recurring: false,
    recurrence: { frequency: "daily", interval: 1, end_type: "never", end_after_occurrences: 10, end_date: "" },
    priority: "medium", notes: "",
    is_bill: false, bill_amount: "", bill_paid: false,
  });

  // Calendar form state
  const [calendarForm, setCalendarForm] = useState({
    name: "",
    color: DEFAULT_COLORS[0]
  });

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    color: DEFAULT_COLORS[0]
  });

  // Sync status state
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);

  const loadSyncStatus = async () => {
    try {
      const res = await apiClient.get("/calendar/sync/status");
      setSyncStatus(res.data);
    } catch {}
  };

  const handleRefreshSync = async () => {
    setSyncLoading(true);
    await loadSyncStatus();
    await loadEvents();
    setSyncLoading(false);
    toast.success("Calendar refreshed");
  };

  // Load data
  useEffect(() => {
    loadData();
    loadSyncStatus();
  }, []);

  useEffect(() => {
    if (calendars.length > 0 && selectedCalendars.length === 0) {
      setSelectedCalendars(calendars.map(c => c.id));
    }
  }, [calendars]);

  useEffect(() => {
    if (selectedCalendars.length > 0) {
      loadEvents();
    }
  }, [currentDate, viewMode, selectedCalendars]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [calendarsRes, categoriesRes] = await Promise.all([
        apiClient.get("/calendars"),
        apiClient.get("/calendars/categories")
      ]);
      setCalendars(calendarsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      let start, end;
      if (viewMode === "month") {
        start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        start.setDate(start.getDate() - 7);
        end.setDate(end.getDate() + 7);
      } else if (viewMode === "week") {
        start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay());
        end = new Date(start);
        end.setDate(end.getDate() + 6);
      } else {
        start = new Date(currentDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(currentDate);
        end.setHours(23, 59, 59, 999);
      }

      const response = await apiClient.get("/calendars/events", {
        params: {
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          calendar_ids: selectedCalendars.join(",")
        }
      });
      setEvents(response.data);
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  };

  // Navigation
  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  // Event handlers
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    const dateStr = date.toISOString().split("T")[0];
    setEventForm({
      ...eventForm,
      title: "",
      description: "",
      start_time: `${dateStr}T09:00`,
      end_time: `${dateStr}T10:00`,
      calendar_id: calendars.find(c => c.is_default)?.id || calendars[0]?.id || "",
      category_id: "",
      location: "",
      all_day: false,
      is_recurring: false,
      notes: ""
    });
    setShowEventModal(true);
  };

  const handleEventClick = (event) => {
    // Synced events (from external apps) are read-only — don't open edit modal
    if (event.is_synced) {
      toast.info(`${event.title} (synced from ${event.synced_from || "external"}) — read only`);
      return;
    }
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || "",
      start_time: (event.start_time || "").slice(0, 16),
      end_time: (event.end_time || "").slice(0, 16),
      all_day: event.all_day || false,
      calendar_id: event.calendar_id || "",
      category_id: event.category_id || "",
      location: event.location || "",
      reminder_minutes: event.reminder_minutes || 15,
      is_recurring: event.is_recurring || false,
      recurrence: event.recurrence || { frequency: "daily", interval: 1, end_type: "never" },
      priority: event.priority || "medium",
      notes: event.notes || "",
      is_bill: event.is_bill || false,
      bill_amount: event.bill_amount || "",
      bill_paid: event.bill_paid || false,
    });
    setShowEventModal(true);
  };

  // CRUD operations
  const saveEvent = async () => {
    if (!eventForm.title || !eventForm.start_time || !eventForm.end_time) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const eventData = {
        ...eventForm,
        category_id: eventForm.category_id === "none" ? "" : eventForm.category_id,
        start_time: new Date(eventForm.start_time).toISOString(),
        end_time: new Date(eventForm.end_time).toISOString(),
        bill_amount: eventForm.is_bill && eventForm.bill_amount ? parseFloat(eventForm.bill_amount) : null,
      };

      if (selectedEvent) {
        await apiClient.put(`/calendars/events/${selectedEvent.id}`, eventData);
        toast.success("Event updated");
      } else {
        await apiClient.post("/calendars/events", eventData);
        toast.success("Event created");
      }
      
      setShowEventModal(false);
      loadEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save event");
    }
  };

  const deleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      await apiClient.delete(`/calendars/events/${selectedEvent.id}`);
      toast.success("Event deleted");
      setShowEventModal(false);
      loadEvents();
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const createCalendar = async () => {
    if (!calendarForm.name) {
      toast.error("Please enter a calendar name");
      return;
    }

    try {
      await apiClient.post("/calendars", calendarForm);
      toast.success("Calendar created");
      setShowCalendarModal(false);
      setCalendarForm({ name: "", color: DEFAULT_COLORS[0] });
      loadData();
    } catch (error) {
      toast.error("Failed to create calendar");
    }
  };

  const deleteCalendar = async (id) => {
    try {
      await apiClient.delete(`/calendars/${id}`);
      toast.success("Calendar deleted");
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete calendar");
    }
  };

  const createCategory = async () => {
    if (!categoryForm.name) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      await apiClient.post("/calendars/categories", categoryForm);
      toast.success("Category created");
      setShowCategoryModal(false);
      setCategoryForm({ name: "", color: DEFAULT_COLORS[0] });
      loadData();
    } catch (error) {
      toast.error("Failed to create category");
    }
  };

  const toggleCalendarVisibility = (id) => {
    setSelectedCalendars(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Helper functions
  const getCalendarColor = (calendarId) => {
    return calendars.find(c => c.id === calendarId)?.color || "#3b82f6";
  };

  const getCategoryColor = (categoryId) => {
    return categories.find(c => c.id === categoryId)?.color;
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get events for a specific day
  const getEventsForDay = (day) => {
    return events.filter(e => {
      const eventDate = new Date(e.start_time);
      return eventDate.toDateString() === day.toDateString();
    });
  };

  // Mini Calendar Component
  const MiniCalendar = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const days = [];
    let date = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }

    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={navigatePrev} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
          <span className="text-sm font-medium text-white">
            {MONTHS[currentDate.getMonth()].slice(0, 3)} {currentDate.getFullYear()}
          </span>
          <button onClick={navigateNext} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-[10px] text-slate-500 text-center py-1">
              {d}
            </div>
          ))}
          {days.map((day, i) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const hasEvents = getEventsForDay(day).length > 0;
            
            return (
              <button
                key={i}
                onClick={() => setCurrentDate(day)}
                className={`
                  text-xs p-1 rounded-lg transition-all relative
                  ${isToday ? "bg-blue-500 text-white font-bold" : ""}
                  ${!isCurrentMonth ? "text-slate-600" : "text-slate-300"}
                  ${isCurrentMonth && !isToday ? "hover:bg-white/10" : ""}
                `}
              >
                {day.getDate()}
                {hasEvents && !isToday && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Month View Component
  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
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
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/50">
          {DAYS_FULL.map((day, i) => (
            <div key={day} className={`p-3 text-center text-sm font-medium ${
              i === 0 || i === 6 ? "text-slate-400" : "text-slate-600 dark:text-slate-300"
            }`}>
              <span className="hidden md:inline">{day}</span>
              <span className="md:hidden">{DAYS[i]}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="flex-1 grid" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-t border-slate-100 dark:border-slate-800">
              {week.map((day, dayIndex) => {
                const isToday = day.toDateString() === new Date().toDateString();
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isWeekend = dayIndex === 0 || dayIndex === 6;
                const dayEvents = getEventsForDay(day);
                
                return (
                  <div
                    key={dayIndex}
                    className={`
                      min-h-[120px] p-2 border-r border-slate-100 dark:border-slate-800 
                      cursor-pointer transition-all group
                      ${!isCurrentMonth ? "bg-slate-50/50 dark:bg-slate-800/30" : ""}
                      ${isWeekend && isCurrentMonth ? "bg-slate-50/30 dark:bg-slate-800/20" : ""}
                      hover:bg-blue-50/50 dark:hover:bg-blue-900/20
                    `}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`
                        text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full
                        transition-all
                        ${isToday 
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" 
                          : !isCurrentMonth 
                            ? "text-slate-400" 
                            : "text-slate-700 dark:text-slate-200 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50"
                        }
                      `}>
                        {day.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div
                          key={event.occurrence_id || event.id}
                          className="group/event relative"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                        >
                          <div 
                            className="text-[11px] px-2 py-1 rounded-lg truncate cursor-pointer
                              transition-all hover:scale-[1.02] hover:shadow-md"
                            style={{ 
                              backgroundColor: `${getCategoryColor(event.category_id) || getCalendarColor(event.calendar_id)}15`,
                              borderLeft: `3px solid ${getCategoryColor(event.category_id) || getCalendarColor(event.calendar_id)}`,
                              color: getCategoryColor(event.category_id) || getCalendarColor(event.calendar_id)
                            }}
                          >
                            {!event.all_day && (
                              <span className="font-semibold">{formatTime(event.start_time)} </span>
                            )}
                            <span className="font-medium">{event.title}</span>
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-blue-500 font-medium pl-2 cursor-pointer hover:underline">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Week View Component
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <div className="p-3 text-center text-sm font-medium text-slate-400 border-r border-slate-200 dark:border-slate-700">
            <Clock className="w-4 h-4 mx-auto" />
          </div>
          {days.map((day, i) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div 
                key={i} 
                className={`p-3 text-center border-r border-slate-200 dark:border-slate-700 transition-colors ${
                  isToday ? "bg-blue-50 dark:bg-blue-900/30" : ""
                }`}
              >
                <div className="text-xs text-slate-400 uppercase tracking-wide">{DAYS[day.getDay()]}</div>
                <div className={`text-xl font-bold mt-1 ${
                  isToday ? "text-blue-500" : "text-slate-700 dark:text-slate-200"
                }`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Time grid */}
        <div className="flex-1 overflow-auto">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-slate-100 dark:border-slate-800 min-h-[60px]">
              <div className="p-1 text-[10px] text-slate-400 border-r border-slate-100 dark:border-slate-800 text-right pr-2 pt-2">
                {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
              </div>
              {days.map((day, dayIndex) => {
                const isToday = day.toDateString() === new Date().toDateString();
                const dayEvents = events.filter(e => {
                  const eventDate = new Date(e.start_time);
                  const eventHour = eventDate.getHours();
                  return eventDate.toDateString() === day.toDateString() && eventHour === hour;
                });
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`
                      border-r border-slate-100 dark:border-slate-800 p-1 relative cursor-pointer
                      hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors
                      ${isToday ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}
                    `}
                    onClick={() => {
                      const clickDate = new Date(day);
                      clickDate.setHours(hour, 0, 0, 0);
                      handleDateClick(clickDate);
                    }}
                  >
                    {dayEvents.map((event, i) => (
                      <div
                        key={event.occurrence_id || event.id}
                        className="text-[10px] px-1.5 py-1 rounded mb-1 truncate cursor-pointer
                          hover:shadow-md transition-all"
                        style={{ 
                          backgroundColor: getCategoryColor(event.category_id) || getCalendarColor(event.calendar_id),
                          color: "white"
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                      >
                        <span className="font-semibold">{formatTime(event.start_time)}</span> {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Day View Component
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const isToday = currentDate.toDateString() === new Date().toDateString();
    
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        {/* Day header */}
        <div className={`p-6 border-b border-slate-200 dark:border-slate-700 ${
          isToday ? "bg-gradient-to-r from-blue-500 to-blue-600" : "bg-slate-50 dark:bg-slate-800/50"
        }`}>
          <div className={`text-sm uppercase tracking-wide ${isToday ? "text-blue-100" : "text-slate-400"}`}>
            {DAYS_FULL[currentDate.getDay()]}
          </div>
          <div className={`text-4xl font-bold ${isToday ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>
            {currentDate.getDate()}
          </div>
          <div className={`text-sm ${isToday ? "text-blue-100" : "text-slate-400"}`}>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
        </div>
        
        {/* Time grid */}
        <div className="flex-1 overflow-auto">
          {hours.map(hour => {
            const hourEvents = events.filter(e => {
              const eventDate = new Date(e.start_time);
              return eventDate.toDateString() === currentDate.toDateString() && eventDate.getHours() === hour;
            });
            
            return (
              <div 
                key={hour} 
                className="flex border-b border-slate-100 dark:border-slate-800 min-h-[80px] cursor-pointer
                  hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors"
                onClick={() => {
                  const clickDate = new Date(currentDate);
                  clickDate.setHours(hour, 0, 0, 0);
                  handleDateClick(clickDate);
                }}
              >
                <div className="w-20 p-2 text-xs text-slate-400 text-right pr-4 pt-2 border-r border-slate-100 dark:border-slate-800">
                  {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                </div>
                <div className="flex-1 p-2">
                  {hourEvents.map((event) => (
                    <div
                      key={event.occurrence_id || event.id}
                      className="mb-2 p-3 rounded-xl cursor-pointer hover:shadow-lg transition-all"
                      style={{ 
                        backgroundColor: `${getCategoryColor(event.category_id) || getCalendarColor(event.calendar_id)}15`,
                        borderLeft: `4px solid ${getCategoryColor(event.category_id) || getCalendarColor(event.calendar_id)}`
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                    >
                      <div className="font-semibold text-slate-700 dark:text-slate-200">{event.title}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </div>
                      {event.location && (
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex bg-slate-100 dark:bg-slate-950" data-testid="calendar-page">
      {/* Sidebar */}
      <div className="w-72 p-4 overflow-auto">
        {/* New Event Button */}
        <Button 
          onClick={() => handleDateClick(new Date())}
          className="w-full mb-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
            text-white shadow-lg shadow-blue-500/30 rounded-xl h-12 text-base font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Event
        </Button>

        {/* Mini Calendar */}
        <MiniCalendar />
        
        {/* My Calendars */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              My Calendars
            </h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800" 
              onClick={() => setShowCalendarModal(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {calendars.map(calendar => (
              <div 
                key={calendar.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 
                  cursor-pointer group transition-all"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={selectedCalendars.includes(calendar.id)}
                    onChange={() => toggleCalendarVisibility(calendar.id)}
                    className="sr-only peer"
                  />
                  <div 
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                      ${selectedCalendars.includes(calendar.id) ? "" : "border-slate-300 dark:border-slate-600"}
                    `}
                    style={{ 
                      backgroundColor: selectedCalendars.includes(calendar.id) ? calendar.color : "transparent",
                      borderColor: calendar.color
                    }}
                    onClick={() => toggleCalendarVisibility(calendar.id)}
                  >
                    {selectedCalendars.includes(calendar.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <span className="text-sm flex-1 truncate text-slate-700 dark:text-slate-300">{calendar.name}</span>
                {!calendar.is_default && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem 
                        className="text-red-500"
                        onClick={() => deleteCalendar(calendar.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Categories
            </h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800" 
              onClick={() => setShowCategoryModal(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Badge 
                key={category.id}
                variant="outline"
                className="rounded-full px-3 py-1 cursor-pointer hover:shadow-md transition-all"
                style={{ 
                  borderColor: category.color,
                  color: category.color,
                  backgroundColor: `${category.color}10`
                }}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 pl-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={navigatePrev}
                className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                onClick={goToToday}
                className="rounded-lg px-4 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
              >
                Today
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={navigateNext}
                className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {viewMode === "day" 
                ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`
                : `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              }
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* My Client PM sync indicator */}
            {syncStatus && syncStatus.count > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 shadow-sm border border-slate-200 dark:border-slate-700">
                <Link2 className="w-3.5 h-3.5 text-blue-500" />
                <span>{syncStatus.count} synced</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshSync}
              disabled={syncLoading}
              title="Refresh synced events from My Client PM"
              className="rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 text-blue-500 ${syncLoading ? "animate-spin" : ""}`} />
            </Button>

            {/* View mode switcher */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm">
              {["month", "week", "day"].map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "ghost"}
                  onClick={() => setViewMode(mode)}
                  className={`rounded-lg px-4 capitalize ${
                    viewMode === mode 
                      ? "bg-blue-500 text-white hover:bg-blue-600" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === "month" && renderMonthView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "day" && renderDayView()}
      </div>

      {/* Event Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              {selectedEvent ? "Edit Event" : "New Event"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Event title"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start *</Label>
                <Input
                  type="datetime-local"
                  value={eventForm.start_time}
                  onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>End *</Label>
                <Input
                  type="datetime-local"
                  value={eventForm.end_time}
                  onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={eventForm.all_day}
                onCheckedChange={(checked) => setEventForm({ ...eventForm, all_day: checked })}
              />
              <Label>All day event</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Calendar</Label>
                <Select 
                  value={eventForm.calendar_id} 
                  onValueChange={(v) => setEventForm({ ...eventForm, calendar_id: v })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars.map(cal => (
                      <SelectItem key={cal.id} value={cal.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cal.color }} />
                          {cal.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={eventForm.category_id || "none"} 
                  onValueChange={(v) => setEventForm({ ...eventForm, category_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Location
              </Label>
              <Input
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                placeholder="Add location"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Add description"
                rows={3}
                className="rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={eventForm.is_recurring}
                onCheckedChange={(checked) => setEventForm({ ...eventForm, is_recurring: checked })}
              />
              <Label className="flex items-center gap-2">
                <Repeat className="w-4 h-4" /> Recurring event
              </Label>
            </div>

            {eventForm.is_recurring && (
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Repeat</Label>
                    <Select
                      value={eventForm.recurrence.frequency}
                      onValueChange={(v) => setEventForm({
                        ...eventForm,
                        recurrence: { ...eventForm.recurrence, frequency: v, interval: 1 }
                      })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Every&nbsp;
                      <span className="text-muted-foreground font-normal text-xs">
                        {eventForm.recurrence.frequency === "daily" ? "day(s)" :
                         eventForm.recurrence.frequency === "weekly" ? "week(s)" :
                         eventForm.recurrence.frequency === "monthly" ? "month(s)" : "year(s)"}
                      </span>
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max={eventForm.recurrence.frequency === "monthly" ? "12" :
                           eventForm.recurrence.frequency === "yearly" ? "10" : "365"}
                      value={eventForm.recurrence.interval}
                      onChange={(e) => setEventForm({
                        ...eventForm,
                        recurrence: { ...eventForm.recurrence, interval: parseInt(e.target.value) || 1 }
                      })}
                      className="rounded-xl"
                    />
                    {eventForm.recurrence.frequency === "monthly" && (
                      <p className="text-xs text-muted-foreground">
                        Repeats on day {new Date(eventForm.start_time || Date.now()).getDate()} of every {eventForm.recurrence.interval} month(s)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bill toggle — admin only */}
          {user?.is_admin && (
            <div className="mx-6 mb-2 p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    💰 Is this a bill?
                  </Label>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Adds it to the Accounting page as a line item</p>
                </div>
                <Switch
                  checked={eventForm.is_bill}
                  onCheckedChange={(v) => setEventForm({ ...eventForm, is_bill: v })}
                  data-testid="is-bill-toggle"
                />
              </div>
              {eventForm.is_bill && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={eventForm.bill_amount}
                    onChange={e => setEventForm({ ...eventForm, bill_amount: e.target.value })}
                    className="flex h-9 flex-1 rounded-lg border border-amber-200 bg-white dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    data-testid="bill-amount-input"
                  />
                  <div className="flex items-center gap-1.5 ml-2">
                    <Switch
                      checked={eventForm.bill_paid}
                      onCheckedChange={(v) => setEventForm({ ...eventForm, bill_paid: v })}
                      data-testid="bill-paid-toggle"
                    />
                    <span className="text-xs text-amber-700 dark:text-amber-400">Paid</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 px-6 pb-4">
            {selectedEvent && (
              <Button variant="destructive" onClick={deleteEvent} className="mr-auto rounded-xl">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowEventModal(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={saveEvent} className="rounded-xl bg-blue-500 hover:bg-blue-600">
              <Check className="w-4 h-4 mr-2" />
              {selectedEvent ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar Modal */}
      <Dialog open={showCalendarModal} onOpenChange={setShowCalendarModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Calendar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={calendarForm.name}
                onChange={(e) => setCalendarForm({ ...calendarForm, name: e.target.value })}
                placeholder="Calendar name"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full transition-all ${
                      calendarForm.color === color ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCalendarForm({ ...calendarForm, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalendarModal(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={createCalendar} className="rounded-xl bg-blue-500 hover:bg-blue-600">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Category name"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full transition-all ${
                      categoryForm.color === color ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCategoryForm({ ...categoryForm, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryModal(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={createCategory} className="rounded-xl bg-blue-500 hover:bg-blue-600">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
