'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  ExternalLink,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

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
const mockEvents: CalendarEvent[] = [

];

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

  // Sync initial events on prop change
  useEffect(() => {
    setEventsState(initialEvents.length > 0 ? initialEvents : []);
    setCalendarErrorState(calendarError);
  }, [initialEvents, calendarError]);

  // Fetch events when the current month changes
  useEffect(() => {
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

    fetchEvents();
  }, [currentMonthDate]);

  const getEventsForDate = (date: Date) => {
    const list = eventsState.length > 0 ? eventsState : mockEvents;
    return list.filter((event) => {
      if (!event.start?.dateTime && !event.start?.date) return false;
      const startStr = event.start.dateTime || event.start.date || '';
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
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Header */}
      <div className="h-16 px-6 border-b border-[#E5E7EB] flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="h-5 w-5 text-slate-600" />
          <h1 className="text-lg font-bold text-slate-900">Calendar</h1>
          <span className="text-xs text-slate-500 font-medium">
            {dailyEvents.length} events today
          </span>
        </div>
      </div>

      {/* Calendar body layout: Left/Right Split */}
      <div className="flex-1 flex flex-row min-h-0 divide-x divide-slate-100 bg-white">
        
        {/* LEFT COLUMN: Calendar Month View */}
        <div className="w-[360px] md:w-[380px] shrink-0 flex flex-col min-h-0 bg-white">
          {/* Month Selector Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <h3 className="font-bold text-slate-800 text-sm">
              {currentMonthDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Grid Container */}
          <div className="p-6 bg-white shrink-0">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-x-1.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
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
                        ? 'bg-[#3F6257] text-white font-bold rounded-full shadow-md'
                        : todayActive
                          ? 'border border-emerald-500 text-emerald-600 rounded-full font-bold'
                          : 'text-slate-700 hover:bg-slate-100 rounded-full'
                      }`}>
                      {dayDate.getDate()}
                    </div>
                    {/* Dot indicator */}
                    <div className="h-1 w-full flex items-center justify-center">
                      {eventMark && (
                        <span className={`h-1 w-1 rounded-full ${active ? 'bg-white' : 'bg-emerald-500'}`}></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Event Listing */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#F9FAFB]">
          {/* Header for Selected Day Events */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <h3 className="text-sm font-bold text-slate-800">
              {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {dailyEvents.length} scheduled
            </span>
          </div>

          {/* Events scrollable list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-[#F9FAFB]">
            {eventsLoading && (
              <div className="flex items-center justify-center p-12 space-x-2">
                <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                <span className="text-xs text-slate-400 font-semibold">Updating schedule...</span>
              </div>
            )}

            {calendarErrorState && !eventsLoading && (
              <div className="m-6 flex items-start space-x-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-bold">Calendar API Error:</span> {calendarErrorState}
                  <p className="mt-2 text-xs text-red-800">Ensure your Calendar Google account is connected on the Onboarding screen.</p>
                </div>
              </div>
            )}

            {!calendarErrorState && !eventsLoading && dailyEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center p-20 text-center">
                <CalendarIcon className="h-8 w-8 text-slate-300 mb-2" />
                <span className="font-semibold text-slate-400 text-sm">No events scheduled</span>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  There are no calendar events scheduled for this day.
                </p>
              </div>
            )}

            {!eventsLoading && dailyEvents.map((event, index) => {
              const isAllDay = !event.start?.dateTime;
              const eventTime = formatEventTime(event);

              return (
                <div key={event.id || index} className="p-5 space-y-2.5 hover:bg-white transition-colors bg-[#F9FAFB]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        {event.summary || '(no title)'}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                      <Clock className="h-3 w-3 text-indigo-500" />
                      <span>{isAllDay ? 'All Day' : `${eventTime} - ${event.end?.dateTime ? new Date(event.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`}</span>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl font-normal">
                      {event.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                    {event.location && (
                      <div className="flex items-center space-x-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                        <span className="truncate max-w-xs">{event.location}</span>
                      </div>
                    )}

                    {event.htmlLink && (
                      <a
                        href={event.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors text-[11px]"
                      >
                        <span>Open in Calendar</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
