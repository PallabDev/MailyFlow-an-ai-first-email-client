'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { X, Search, SlidersHorizontal } from 'lucide-react';

type AdvancedSearchPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

type FilterState = {
  from: string;
  to: string;
  subject: string;
  hasAttachment: boolean;
  dateFrom: string;
  dateTo: string;
  priority: string;
};

const INITIAL_FILTERS: FilterState = {
  from: '',
  to: '',
  subject: '',
  hasAttachment: false,
  dateFrom: '',
  dateTo: '',
  priority: '',
};

export default function AdvancedSearchPanel({ isOpen, onClose }: AdvancedSearchPanelProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FilterState>(() => {
    const q = searchParams.get('q') || '';
    const parsed: FilterState = { ...INITIAL_FILTERS };

    const fromMatch = q.match(/from:"?([^"\s]+)"?/i);
    if (fromMatch) parsed.from = fromMatch[1];

    const toMatch = q.match(/to:"?([^"\s]+)"?/i);
    if (toMatch) parsed.to = toMatch[1];

    const subjectMatch = q.match(/subject:"?([^"]+)"?/i);
    if (subjectMatch) parsed.subject = subjectMatch[1];

    if (/has:attachment/i.test(q)) parsed.hasAttachment = true;

    const afterMatch = q.match(/after:(\d{4}-\d{2}-\d{2})/i);
    if (afterMatch) parsed.dateFrom = afterMatch[1];

    const beforeMatch = q.match(/before:(\d{4}-\d{2}-\d{2})/i);
    if (beforeMatch) parsed.dateTo = beforeMatch[1];

    const priorityMatch = q.match(/priority:(urgent|important|normal|low|promo)/i);
    if (priorityMatch) parsed.priority = priorityMatch[1].toLowerCase();

    return parsed;
  });

  // Sync filters when search params change (e.g. on clear)
  useEffect(() => {
    if (!isOpen) return;
    const q = searchParams.get('q') || '';
    const parsed: FilterState = { ...INITIAL_FILTERS };

    const fromMatch = q.match(/from:"?([^"\s]+)"?/i);
    if (fromMatch) parsed.from = fromMatch[1];

    const toMatch = q.match(/to:"?([^"\s]+)"?/i);
    if (toMatch) parsed.to = toMatch[1];

    const subjectMatch = q.match(/subject:"?([^"]+)"?/i);
    if (subjectMatch) parsed.subject = subjectMatch[1];

    if (/has:attachment/i.test(q)) parsed.hasAttachment = true;

    const afterMatch = q.match(/after:(\d{4}-\d{2}-\d{2})/i);
    if (afterMatch) parsed.dateFrom = afterMatch[1];

    const beforeMatch = q.match(/before:(\d{4}-\d{2}-\d{2})/i);
    if (beforeMatch) parsed.dateTo = beforeMatch[1];

    const priorityMatch = q.match(/priority:(urgent|important|normal|low|promo)/i);
    if (priorityMatch) parsed.priority = priorityMatch[1].toLowerCase();

    setFilters(parsed);
  }, [isOpen, searchParams]);

  const buildQuery = useCallback((f: FilterState): string => {
    const parts: string[] = [];
    if (f.from) parts.push(`from:${f.from}`);
    if (f.to) parts.push(`to:${f.to}`);
    if (f.subject) parts.push(`subject:"${f.subject}"`);
    if (f.hasAttachment) parts.push('has:attachment');
    if (f.dateFrom) parts.push(`after:${f.dateFrom}`);
    if (f.dateTo) parts.push(`before:${f.dateTo}`);
    if (f.priority) parts.push(`priority:${f.priority}`);
    return parts.join(' ');
  }, []);

  const applyFilters = () => {
    const query = buildQuery(filters);
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    const queryStr = params.toString();
    const targetUrl = queryStr ? `${pathname}?${queryStr}` : pathname;
    router.replace(targetUrl, { scroll: false });
    onClose();
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    const queryStr = params.toString();
    const targetUrl = queryStr ? `${pathname}?${queryStr}` : pathname;
    router.replace(targetUrl, { scroll: false });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-4 w-4 text-accent" />
            <span className="text-sm font-bold text-foreground">Advanced Search</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-hover-row rounded-lg transition-colors cursor-pointer text-text-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">From</label>
              <input
                type="text"
                value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                placeholder="sender@example.com"
                className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm text-foreground placeholder-slate-400 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">To</label>
              <input
                type="text"
                value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                placeholder="recipient@example.com"
                className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm text-foreground placeholder-slate-400 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">Subject</label>
            <input
              type="text"
              value={filters.subject}
              onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))}
              placeholder="keyword or phrase"
              className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm text-foreground placeholder-slate-400 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">After Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">Before Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
              >
                <option value="">Any priority</option>
                <option value="urgent">Urgent</option>
                <option value="important">Important</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
                <option value="promo">Promotional</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={filters.hasAttachment}
                  onChange={(e) => setFilters((f) => ({ ...f, hasAttachment: e.target.checked }))}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent accent-accent bg-background cursor-pointer"
                />
                <span className="text-sm text-text-secondary font-medium">Has attachment</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface/50">
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-hover-row rounded-lg transition-colors cursor-pointer"
          >
            Clear all
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-hover-row rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={applyFilters}
              className="inline-flex items-center space-x-1.5 px-5 py-2 bg-accent hover:opacity-90 text-white text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
