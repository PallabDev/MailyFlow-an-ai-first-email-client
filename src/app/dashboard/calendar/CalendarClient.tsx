'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import EventModal from '../_components/EventModal';

type CalendarEvent = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{ email?: string; displayName?: string; responseStatus?: string }>;
};

type CalendarClientProps = {
  initialEvents: CalendarEvent[];
  calendarError: string | null;
};

// Mock fallback events if no connection exists
const mockEvents: CalendarEvent[] = [];

export default function CalendarClient({
  initialEvents,
  calendarError,
}: CalendarClientProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventsState, setEventsState] = useState<CalendarEvent[]>(initialEvents.length > 0 ? initialEvents : []);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [calendarErrorState, setCalendarErrorState] = useState<string | null>(calendarError);
  const [isGridCollapsed, setIsGridCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsGridCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // States for Event Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);

  // Sync initial events on prop change
  useEffect(() => {
    setEventsState(initialEvents.length > 0 ? initialEvents : []);
    setCalendarErrorState(calendarError);
  }, [initialEvents, calendarError]);

  // Fetch events function
  const fetchEvents = async () => {
    setEventsLoading(true);
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const start = new Date(year, month - 1, 20);
    const end = new Date(year, month + 1, 10);

    try {
      const res = await fetch(`/api/calendar?timeMin=${encodeURIComponent(start.toISOString())}&timeMax=${encodeURIComponent(end.toISOString())}`);
      if (res.ok) {
        const data = await res.json();
        setEventsState(data.events ?? []);
        setCalendarErrorState(null);
      } else {
        const data = await res.json();
        setCalendarErrorState(data.error || 'Failed to fetch calendar events.');
      }
    } catch (err: any) {
      console.error('Error fetching calendar events:', err);
      setCalendarErrorState('Failed to fetch calendar events.');
    } finally {
      setEventsLoading(false);
    }
  };

  // Fetch events when the current month changes
  useEffect(() => {
    fetchEvents();
  }, [currentMonthDate]);

  const getEventsForDate = (date: Date) => {
    const list = eventsState.length > 0 ? eventsState : mockEvents;
    return list.filter((event) => {
      if (!event.start?.dateTime && !event.start?.date) return false;
      
      if (event.start.date) {
        const [yyyy, mm, dd] = event.start.date.split('-').map(Number);
        return (
          yyyy === date.getFullYear() &&
          (mm - 1) === date.getMonth() &&
          dd === date.getDate()
        );
      }

      const startStr = event.start.dateTime || '';
      const eventDate = new Date(startStr);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    daysArray.push(new Date(year, month, i));
  }

  const isToday = (d: Date) => {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };

  const isSelected = (d: Date) => {
    return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
  };

  const hasEvents = (d: Date) => {
    return getEventsForDate(d).length > 0;
  };

  const handlePrevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleAddEvent = () => {
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  const dailyEvents = getEventsForDate(selectedDate).filter(
    (event) =>
      event.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatEventTime = (event: CalendarEvent) => {
    if (event.start?.dateTime) {
      const date = new Date(event.start.dateTime);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return 'All Day';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-text-primary">
      {/* Header */}
      <div className="h-16 px-6 border-b border-border flex items-center justify-between shrink-0 bg-card">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="h-5 w-5 text-text-secondary" />
          <h1 className="text-lg font-bold text-text-primary">Calendar</h1>

          {/* Refresh Button */}
          <button
            onClick={fetchEvents}
            disabled={eventsLoading}
            className={`p-1.5 text-text-secondary hover:text-text-primary hover:bg-sidebar-hover rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
              eventsLoading ? 'animate-spin opacity-50' : ''
            }`}
            title="Refresh events"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <span className="text-xs text-text-secondary font-medium">
            {eventsState.filter(e => {
              if (!e.start?.dateTime && !e.start?.date) return false;
              const d = new Date(e.start.dateTime || e.start.date || '');
              return isToday(d);
            }).length} events today
          </span>
        </div>
        <button
          onClick={handleAddEvent}
          className="inline-flex items-center space-x-1.5 bg-success text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all hover:opacity-95 active:scale-95 cursor-pointer"
        >
          <span>+ Add Event</span>
        </button>
      </div>

      {/* Calendar body layout: Stacked on mobile, Left/Right Split on desktop */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 md:divide-x divide-y md:divide-y-0 divide-border bg-card">
        
        {/* LEFT COLUMN: Calendar Month View */}
        <div className="w-full md:w-[360px] lg:w-[380px] shrink-0 flex flex-col min-h-0 bg-card">
          {/* Month Selector Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center space-x-3">
              <h3 className="font-bold text-text-primary text-sm">
                {currentMonthDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
              </h3>
              {/* Collapse/Expand Toggle Button (mobile only) */}
              <button
                onClick={() => setIsGridCollapsed(!isGridCollapsed)}
                className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-border bg-background text-text-secondary hover:text-text-primary hover:bg-hover-row transition-all md:hidden flex items-center space-x-1 cursor-pointer"
              >
                <span>{isGridCollapsed ? 'Show Calendar' : 'Hide Calendar'}</span>
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-sidebar-hover rounded text-text-secondary transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-sidebar-hover rounded text-text-secondary transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Grid Container */}
          <div className={`p-6 bg-card shrink-0 transition-all duration-300 ${
            isGridCollapsed && isMobile ? 'hidden' : 'block'
          }`}>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-x-1.5 text-center text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-1">{day}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-2.5 gap-x-1.5 text-center text-sm font-semibold">
              {daysArray.map((dayDate, idx) => {
                if (!dayDate) {
                  return <div key={`empty-${idx}`} className="py-2"></div>;
                }
                const active = isSelected(dayDate);
                const todayActive = isToday(dayDate);
                const eventMark = hasEvents(dayDate);

                return (
                  <div
                    key={dayDate.toISOString()}
                    onClick={() => setSelectedDate(dayDate)}
                    className="flex flex-col items-center justify-center py-1 cursor-pointer"
                  >
                    <div className={`h-8 w-8 flex items-center justify-center text-xs transition-all ${active
                        ? 'bg-success text-white font-bold rounded-full shadow-md'
                        : todayActive
                          ? 'border border-success text-success rounded-full font-bold'
                          : 'text-text-primary hover:bg-hover-row rounded-full'
                      }`}>
                      {dayDate.getDate()}
                    </div>
                    {/* Dot indicator */}
                    <div className="h-1 w-full flex items-center justify-center">
                      {eventMark && (
                        <span className={`h-1 w-1 rounded-full ${active ? 'bg-white' : 'bg-success'}`}></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Event Listing */}
        <div className="flex-1 flex flex-col min-h-0 bg-background">
          {/* Header for Selected Day Events */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-card">
            <h3 className="text-sm font-bold text-text-primary">
              {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <span className="text-xs text-text-secondary font-medium">
              {dailyEvents.length} scheduled
            </span>
          </div>

          {/* Events scrollable list */}
          <div className="flex-1 overflow-y-auto divide-y divide-border-row bg-background">
            {eventsLoading && (
              <div className="divide-y divide-border-row w-full">
                {[...Array(3)].map((_, i) => (
                  <div key={`cal-skeleton-${i}`} className="p-5 space-y-3 animate-pulse bg-background">
                    <div className="flex items-start justify-between gap-4">
                      {/* Event title skeleton */}
                      <div className="h-4 w-40 bg-surface-subtle rounded"></div>
                      {/* Time badge skeleton */}
                      <div className="h-5 w-24 bg-border rounded shrink-0"></div>
                    </div>
                    {/* Description skeleton */}
                    <div className="h-3 w-5/6 bg-border rounded"></div>
                    {/* Location badge skeleton */}
                    <div className="h-4 w-28 bg-surface-subtle rounded"></div>
                  </div>
                ))}
              </div>
            )}

            {calendarErrorState && !eventsLoading && (
              <div className="m-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-700">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
                  <div className="text-sm space-y-1">
                    <span className="font-bold block text-red-800">Calendar Connection Error</span>
                    <p className="text-red-700 font-medium">{calendarErrorState}</p>
                    <p className="text-xs text-red-600/80">Your Google Calendar connection needs to be re-authorized to sync events.</p>
                  </div>
                </div>
                <a
                  href="/api/auth/connect?plugin=googlecalendar"
                  className="shrink-0 inline-flex items-center space-x-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer decoration-none"
                >
                  <span>Reconnect Calendar</span>
                </a>
              </div>
            )}

            {!calendarErrorState && !eventsLoading && dailyEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center p-20 text-center">
                <CalendarIcon className="h-8 w-8 text-text-muted mb-2" />
                <span className="font-semibold text-text-secondary text-sm">No events scheduled</span>
                <p className="text-xs text-text-muted mt-1 max-w-xs">
                  There are no calendar events scheduled for this day.
                </p>
              </div>
            )}

            {!eventsLoading && dailyEvents.map((event, index) => {
              const isAllDay = !event.start?.dateTime;
              const eventTime = formatEventTime(event);

              return (
                <div
                  key={event.id || index}
                  onClick={() => handleEditEvent(event)}
                  className="p-5 space-y-2.5 hover:bg-card transition-colors bg-background cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-text-primary tracking-tight group-hover:text-success transition-colors">
                        {event.summary || '(no title)'}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-1 text-[11px] text-text-secondary bg-surface-subtle px-2 py-0.5 rounded border border-border shrink-0">
                      <Clock className="h-3 w-3 text-[#5f7a68]" />
                      <span>{isAllDay ? 'All Day' : `${eventTime} - ${event.end?.dateTime ? new Date(event.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`}</span>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-xs text-text-secondary leading-relaxed max-w-2xl font-normal">
                      {event.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary pt-0.5">
                    {event.location && (
                      <div className="flex items-center space-x-1 bg-surface-subtle px-2 py-0.5 rounded border border-border text-[11px]">
                        <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                        <span className="truncate max-w-xs">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Calendar Event CRUD Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEventToEdit(null);
        }}
        onSave={fetchEvents}
        eventToEdit={eventToEdit}
        selectedDate={selectedDate}
      />
    </div>
  );
}

