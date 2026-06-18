'use client';

import React, { useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { X, Search } from 'lucide-react';

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

  const activeFilterCount = [
    filters.from,
    filters.to,
    filters.subject,
    filters.hasAttachment,
    filters.dateFrom,
    filters.dateTo,
    filters.priority,
  ].filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="border-b border-border bg-card px-4 md:px-6 py-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-text-primary">Advanced Filters</span>
          {activeFilterCount > 0 && (
            <span className="text-[10px] font-bold bg-success/15 text-success px-1.5 py-0.5 rounded-full">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-hover-row rounded-lg transition-colors cursor-pointer text-text-muted hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">From</label>
          <input
            type="text"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            placeholder="sender@example.com"
            className="w-full bg-background border border-border rounded-lg py-1.5 px-3 text-sm text-foreground placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">To</label>
          <input
            type="text"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            placeholder="recipient@example.com"
            className="w-full bg-background border border-border rounded-lg py-1.5 px-3 text-sm text-foreground placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">Subject</label>
          <input
            type="text"
            value={filters.subject}
            onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))}
            placeholder="keyword or phrase"
            className="w-full bg-background border border-border rounded-lg py-1.5 px-3 text-sm text-foreground placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">After Date</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            className="w-full bg-background border border-border rounded-lg py-1.5 px-3 text-sm text-foreground focus:outline-none focus:border-slate-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">Before Date</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            className="w-full bg-background border border-border rounded-lg py-1.5 px-3 text-sm text-foreground focus:outline-none focus:border-slate-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wider">Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
            className="w-full bg-background border border-border rounded-lg py-1.5 px-3 text-sm text-foreground focus:outline-none focus:border-slate-500 transition-colors"
          >
            <option value="">Any priority</option>
            <option value="urgent">Urgent</option>
            <option value="important">Important</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
            <option value="promo">Promotional</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hasAttachment}
            onChange={(e) => setFilters((f) => ({ ...f, hasAttachment: e.target.checked }))}
            className="h-4 w-4 rounded border-border text-success focus:ring-success accent-success bg-background cursor-pointer"
          />
          <span className="text-sm text-text-secondary font-medium">Has attachment</span>
        </label>

        <div className="flex items-center space-x-2">
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-hover-row rounded-lg transition-colors cursor-pointer"
          >
            Clear all
          </button>
          <button
            onClick={applyFilters}
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-success hover:opacity-90 text-white text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}
