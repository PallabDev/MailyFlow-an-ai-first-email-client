'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Calendar as CalendarIcon, Link2, CheckCircle2, XCircle, ArrowRight, RefreshCw, Trash2, CalendarRange, Clock, MapPin, AlertCircle } from 'lucide-react';
import { disconnectPlugin } from '../../onboarding/actions';

type CalendarEvent = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

type IntegrationsClientProps = {
  isGmailConnected: boolean;
  isCalendarConnected: boolean;
  dbError: boolean;
};

export default function IntegrationsClient({
  isGmailConnected,
  isCalendarConnected,
  dbError,
}: IntegrationsClientProps) {
  const [gmailLoading, setGmailLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!isCalendarConnected) return;
    setEventsLoading(true);
    setEventsError(null);
    try {
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 14); // Next 14 days

      const res = await fetch(`/api/calendar?timeMin=${encodeURIComponent(start.toISOString())}&timeMax=${encodeURIComponent(end.toISOString())}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
      } else {
        const data = await res.json().catch(() => ({}));
        setEventsError(data.error || 'Failed to load upcoming calendar events.');
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setEventsError('Could not sync upcoming calendar events.');
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [isCalendarConnected]);

  const handleDisconnect = async (plugin: 'gmail' | 'googlecalendar') => {
    if (plugin === 'gmail') setGmailLoading(true);
    if (plugin === 'googlecalendar') setCalendarLoading(true);

    try {
      await disconnectPlugin(plugin);
      // Refresh counts and connections in layout
      window.dispatchEvent(new CustomEvent('refresh-labels'));
      window.location.reload();
    } catch (err) {
      console.error(`Failed to disconnect ${plugin}:`, err);
    } finally {
      if (plugin === 'gmail') setGmailLoading(false);
      if (plugin === 'googlecalendar') setCalendarLoading(false);
    }
  };

  const formatEventDate = (dateVal?: { dateTime?: string; date?: string }) => {
    if (!dateVal) return '';
    const dateStr = dateVal.dateTime || dateVal.date;
    if (!dateStr) return '';
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;

    const options: Intl.DateTimeFormatOptions = dateVal.dateTime 
      ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { month: 'short', day: 'numeric' };
      
    return parsed.toLocaleString('en-US', options);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-text-primary">
      {/* Integrations Header */}
      <div className="h-16 px-6 border-b border-border flex items-center justify-between shrink-0 bg-card">
        <div className="flex items-center space-x-3">
          <Link2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h1 className="text-lg font-bold text-text-primary">Integrations</h1>
        </div>
        <button
          onClick={() => {
            fetchEvents();
          }}
          disabled={eventsLoading}
          className={`p-1.5 text-text-secondary hover:text-text-primary hover:bg-sidebar-hover rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
            eventsLoading ? 'animate-spin opacity-50' : ''
          }`}
          title="Refresh connection details"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {dbError && (
          <div className="flex items-start space-x-2.5 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-600 text-sm font-medium">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
            <span>⚠️ Database storage quota exceeded. Running in offline/fallback mode. Integration changes may not persist.</span>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">Connected Services</h2>
          
          <div className="max-w-xl">
            {/* Google Workspace Integration Card */}
            {(() => {
              const isGoogleConnected = isGmailConnected && isCalendarConnected;
              return (
                <div className={`rounded-2xl border p-6 transition-all duration-300 ${
                  isGoogleConnected ? 'border-success/30 bg-success/5' : 'border-border bg-card hover:border-accent/30'
                }`}>
                  <div className="flex flex-col h-full justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex space-x-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
                          <Mail className="h-6 w-6" />
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
                          <CalendarIcon className="h-6 w-6" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-primary flex items-center space-x-2">
                          <span>Google Account</span>
                          {isGoogleConnected && (
                            <span className="text-success text-xs font-semibold bg-success/10 px-2 py-0.5 rounded-full">
                              Connected
                            </span>
                          )}
                        </h3>
                        <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
                          Authorizes MailyFlow to read, draft, and organize your emails, and sync with your primary Google calendar to manage events and meetings.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      {isGoogleConnected ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2 text-success font-semibold text-sm">
                            <CheckCircle2 className="h-4.5 w-4.5" />
                            <span>Authorized</span>
                          </div>
                          <button
                            onClick={() => handleDisconnect('gmail')}
                            disabled={gmailLoading}
                            className="rounded-xl border border-danger/25 text-danger hover:bg-danger/10 px-4 py-2 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer flex items-center space-x-1.5"
                          >
                            {gmailLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            <span>Disconnect</span>
                          </button>
                        </div>
                      ) : (
                        <a
                          href="/api/auth/connect?plugin=gmail"
                          className="inline-flex items-center space-x-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-accent/90 hover:shadow-sm active:scale-95"
                        >
                          <span>Connect Google Account</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Calendar Events Sync Section */}
        {isCalendarConnected && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center space-x-2">
                <CalendarRange className="h-4 w-4" />
                <span>Upcoming Calendar Events</span>
              </h2>
              <span className="text-[10px] text-text-muted font-medium">Auto-synced from Google</span>
            </div>

            {eventsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={`cal-s-${i}`} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card animate-pulse">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-1/3 bg-surface-subtle rounded"></div>
                      <div className="h-3 w-1/4 bg-border rounded"></div>
                    </div>
                    <div className="h-4 w-20 bg-border rounded"></div>
                  </div>
                ))}
              </div>
            ) : eventsError ? (
              <div className="flex items-center space-x-2 p-4 rounded-xl border border-red-500/10 bg-red-500/5 text-red-700 text-xs font-medium">
                <XCircle className="h-4.5 w-4.5 shrink-0 text-red-500" />
                <span>{eventsError}</span>
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-xl text-center">
                <CalendarIcon className="h-8 w-8 text-text-muted mb-2" />
                <span className="text-xs text-text-secondary font-medium">No events found in the next 14 days</span>
                <p className="text-[10px] text-text-muted mt-0.5">Try scheduling an event using the AI sidebar!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {events.slice(0, 6).map((event) => (
                  <div key={event.id} className="p-4 rounded-xl border border-border bg-card hover:border-accent/20 transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-text-primary leading-tight truncate" title={event.summary}>
                        {event.summary || '(No Title)'}
                      </h4>
                      {event.description && (
                        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-border/50 text-[10px] text-text-secondary font-medium shrink-0">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="h-3.5 w-3.5 text-text-muted" />
                        <span>{formatEventDate(event.start)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="h-3.5 w-3.5 text-text-muted" />
                          <span className="truncate" title={event.location}>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
