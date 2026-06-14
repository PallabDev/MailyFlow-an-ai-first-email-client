'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Trash2, Calendar, Clock, MapPin, Users, AlignLeft } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';

type CalendarEvent = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{ email?: string; displayName?: string }>;
};

type EventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  eventToEdit?: CalendarEvent | null;
  selectedDate?: Date;
};

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  eventToEdit,
  selectedDate,
}: EventModalProps) {
  const isEditMode = !!eventToEdit?.id;
  const { theme } = useChatStore();

  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [attendeesText, setAttendeesText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to format date object to YYYY-MM-DD
  const formatDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper to extract time HH:MM from ISO string
  const formatTimeString = (dateTimeStr: string) => {
    try {
      const d = new Date(dateTimeStr);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // Helper to extract date YYYY-MM-DD from ISO or date string
  const getDatePart = (dateTimeOrDateStr: string) => {
    if (dateTimeOrDateStr.includes('T')) {
      return dateTimeOrDateStr.split('T')[0];
    }
    return dateTimeOrDateStr;
  };

  // Reset/populate form fields when opening modal or modal state changes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (eventToEdit) {
        setSummary(eventToEdit.summary || '');
        setDescription(eventToEdit.description || '');
        setLocation(eventToEdit.location || '');
        
        const allDayEvent = !eventToEdit.start?.dateTime;
        setIsAllDay(allDayEvent);

        if (allDayEvent) {
          const startVal = eventToEdit.start?.date || '';
          const endVal = eventToEdit.end?.date || '';
          setStartDate(startVal);
          setEndDate(endVal);
          setStartTime('');
          setEndTime('');
        } else {
          const startVal = eventToEdit.start?.dateTime || '';
          const endVal = eventToEdit.end?.dateTime || '';
          setStartDate(getDatePart(startVal));
          setStartTime(formatTimeString(startVal));
          setEndDate(getDatePart(endVal));
          setEndTime(formatTimeString(endVal));
        }

        const attendeesEmails = eventToEdit.attendees
          ?.map((a) => a.email)
          .filter(Boolean)
          .join(', ') || '';
        setAttendeesText(attendeesEmails);
      } else {
        // Create mode
        setSummary('');
        setDescription('');
        setLocation('');
        setIsAllDay(false);

        const activeDate = selectedDate || new Date();
        const formattedActiveDate = formatDateString(activeDate);
        setStartDate(formattedActiveDate);
        setEndDate(formattedActiveDate);

        // Default to next nearest hour
        const now = new Date();
        const currentHour = now.getHours();
        const startHour = String((currentHour + 1) % 24).padStart(2, '0');
        const endHour = String((currentHour + 2) % 24).padStart(2, '0');
        setStartTime(`${startHour}:00`);
        setEndTime(`${endHour}:00`);
        setAttendeesText('');
      }
    }
  }, [isOpen, eventToEdit, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      setError('Title/Summary is required.');
      return;
    }
    if (!startDate) {
      setError('Start date is required.');
      return;
    }
    if (!isAllDay && (!startTime || !endTime)) {
      setError('Start and end times are required for non all-day events.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let startPayload: { date?: string; dateTime?: string; timeZone?: string } = {};
      let endPayload: { date?: string; dateTime?: string; timeZone?: string } = {};
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (isAllDay) {
        startPayload = { date: startDate };
        // Google Calendar expects all-day end date to be exclusive (e.g. if start is 2026-06-12, end is 2026-06-13 for a single day)
        // Let's ensure the user entered end date matches standard expectations, or just save whatever they set
        endPayload = { date: endDate || startDate };
      } else {
        const startDateTimeObj = new Date(`${startDate}T${startTime}`);
        const endDateTimeObj = new Date(`${endDate || startDate}T${endTime}`);
        startPayload = {
          dateTime: startDateTimeObj.toISOString(),
          timeZone: tz,
        };
        endPayload = {
          dateTime: endDateTimeObj.toISOString(),
          timeZone: tz,
        };
      }

      const attendees = attendeesText
        .split(',')
        .map((email) => ({ email: email.trim() }))
        .filter((a) => a.email);

      const eventPayload = {
        summary,
        description,
        location,
        start: startPayload,
        end: endPayload,
        attendees,
      };

      const res = await fetch('/api/calendar', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEditMode
            ? { id: eventToEdit?.id, event: eventPayload }
            : { event: eventPayload }
        ),
      });

      if (res.ok) {
        onSave();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save event.');
      }
    } catch (err: any) {
      console.error('Error saving event:', err);
      setError(err.message || 'Failed to save event.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToEdit?.id) return;
    if (!confirm('Are you sure you want to delete this event?')) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/calendar?id=${eventToEdit.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onSave();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete event.');
      }
    } catch (err: any) {
      console.error('Error deleting event:', err);
      setError(err.message || 'Failed to delete event.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl relative animate-zoom-in overflow-hidden flex flex-col max-h-[90vh] text-text-primary">
        
        {/* Header */}
        <div className="h-14 px-6 border-b border-border flex items-center justify-between bg-surface-subtle shrink-0">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4.5 w-4.5 text-indigo-500" />
            <span className="font-bold text-text-primary text-sm">
              {isEditMode ? 'Edit Event Details' : 'Create New Event'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:bg-sidebar-hover hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium leading-relaxed">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Event Title</label>
            <input
              type="text"
              placeholder="Add title and time"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-2.5 px-3.5 text-sm text-text-primary placeholder-slate-400 focus:outline-none focus:border-slate-500 shadow-sm transition-all font-semibold"
              required
              disabled={loading}
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center space-x-2 py-1">
            <input
              type="checkbox"
              id="isAllDay"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="h-4 w-4 text-success border-border rounded focus:ring-success accent-success cursor-pointer bg-background"
              disabled={loading}
            />
            <label htmlFor="isAllDay" className="text-xs font-bold text-text-secondary cursor-pointer select-none">
              All day event
            </label>
          </div>

          {/* Date and Time Fields */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date & Time */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center space-x-1">
                <Clock className="h-3 w-3 text-text-muted" />
                <span>Starts</span>
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate < e.target.value) {
                      setEndDate(e.target.value);
                    }
                  }}
                  className="w-full bg-background border border-border rounded-xl py-2 px-3.5 text-xs text-text-primary focus:outline-none focus:border-slate-500 shadow-sm transition-all"
                  style={{ colorScheme: theme }}
                  required
                  disabled={loading}
                />
                {!isAllDay && (
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3.5 text-xs text-text-primary focus:outline-none focus:border-slate-500 shadow-sm transition-all"
                    style={{ colorScheme: theme }}
                    required={!isAllDay}
                    disabled={loading}
                  />
                )}
              </div>
            </div>

            {/* End Date & Time */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center space-x-1">
                <Clock className="h-3 w-3 text-text-muted" />
                <span>Ends</span>
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-2 px-3.5 text-xs text-text-primary focus:outline-none focus:border-slate-500 shadow-sm transition-all"
                  style={{ colorScheme: theme }}
                  required
                  disabled={loading}
                />
                {!isAllDay && (
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3.5 text-xs text-text-primary focus:outline-none focus:border-slate-500 shadow-sm transition-all"
                    style={{ colorScheme: theme }}
                    required={!isAllDay}
                    disabled={loading}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center space-x-1">
              <MapPin className="h-3 w-3 text-text-muted" />
              <span>Location</span>
            </label>
            <input
              type="text"
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-2 px-3.5 text-sm text-text-primary placeholder-slate-400 focus:outline-none focus:border-slate-500 shadow-sm transition-all"
              disabled={loading}
            />
          </div>

          {/* Guests / Attendees */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center space-x-1">
              <Users className="h-3 w-3 text-text-muted" />
              <span>Add Guests (emails)</span>
            </label>
            <input
              type="text"
              placeholder="guest1@gmail.com, guest2@gmail.com"
              value={attendeesText}
              onChange={(e) => setAttendeesText(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-2 px-3.5 text-sm text-text-primary placeholder-slate-400 focus:outline-none focus:border-slate-500 shadow-sm transition-all"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center space-x-1">
              <AlignLeft className="h-3 w-3 text-text-muted" />
              <span>Description / Notes</span>
            </label>
            <textarea
              rows={4}
              placeholder="Add description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-2 px-3.5 text-sm text-text-primary placeholder-slate-400 focus:outline-none focus:border-slate-500 shadow-sm transition-all resize-none"
              disabled={loading}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border shrink-0">
            {isEditMode ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center space-x-1 text-red-500 hover:text-red-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Event</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-text-secondary hover:bg-hover-row hover:text-text-primary transition-all cursor-pointer bg-card disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-success hover:opacity-90 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
