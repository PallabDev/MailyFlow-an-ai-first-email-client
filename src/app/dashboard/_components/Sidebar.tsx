'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Mail,
  Calendar as CalendarIcon,
  Inbox as InboxIcon,
  AlertCircle,
  FileText,
  ChevronRight,
  ChevronLeft,
  Send,
  Clock
} from 'lucide-react';

type SidebarProps = {
  projectName: string;
  isLeftSidebarCollapsed: boolean;
  setIsLeftSidebarCollapsed: (val: boolean) => void;
};

export default function Sidebar({
  projectName,
  isLeftSidebarCollapsed,
  setIsLeftSidebarCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active folder based on pathname
  const lastSegment = pathname.split('/').pop() || 'inbox';
  const activeTab = (lastSegment === 'draft' || lastSegment === 'drafts') ? 'drafts' : lastSegment;

  const [inboxUnread, setInboxUnread] = useState(0);
  const [draftsTotal, setDraftsTotal] = useState(0);
  const [spamTotal, setSpamTotal] = useState(0);

  // Fetch labels count on mount once (no polling)
  useEffect(() => {
    const fetchCounts = async (force: boolean = false) => {
      try {
        const res = await fetch(`/api/labels${force ? '?refresh=true' : ''}`);
        if (res.ok) {
          const data = await res.json();
          setInboxUnread(data.inbox?.unread ?? 0);
          setDraftsTotal(data.drafts?.total ?? 0);
          setSpamTotal(data.spam?.total ?? 0);
        }
      } catch (err) {
        console.error('Failed to fetch label counts:', err);
      }
    };

    fetchCounts(false);

    const handleRefreshLabels = () => {
      fetchCounts(true);
    };

    window.addEventListener('refresh-labels', handleRefreshLabels);
    return () => {
      window.removeEventListener('refresh-labels', handleRefreshLabels);
    };
  }, []);

  const navigateToTab = (tab: string) => {
    const target = tab === 'drafts' ? 'draft' : tab;
    router.push(`/dashboard/${target}`);
  };

  return (
    <aside className={`border-r border-sidebar-border bg-sidebar-bg text-sidebar-text flex flex-col justify-between transition-all duration-300 ${
      isLeftSidebarCollapsed ? 'w-16' : 'w-60'
    }`}>
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo & Toggle Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-sidebar-border bg-card">
          {!isLeftSidebarCollapsed && (
            <div className="flex items-center">
              <span className="font-bold text-card-foreground tracking-tight text-lg">{projectName}</span>
            </div>
          )}
          <button
            onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
            className="p-1.5 border border-border/80 dark:border-border hover:bg-sidebar-hover rounded-full text-sidebar-text hover:text-sidebar-active-text transition-colors cursor-pointer flex items-center justify-center h-7 w-7"
          >
            {isLeftSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          <div className="space-y-1">
            {!isLeftSidebarCollapsed && (
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Mail</span>
              </div>
            )}
            <nav className="space-y-0.5">
              <button
                onClick={() => navigateToTab('inbox')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  activeTab === 'inbox'
                    ? 'bg-sidebar-active-bg text-sidebar-active-text font-bold'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active-text'
                }`}
              >
                <Mail className="h-4.5 w-4.5 shrink-0" />
                {!isLeftSidebarCollapsed && (
                  <span className="ml-3 flex-1 text-left">Inbox</span>
                )}
              </button>

              <button
                onClick={() => navigateToTab('drafts')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  activeTab === 'drafts'
                    ? 'bg-sidebar-active-bg text-sidebar-active-text font-bold'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active-text'
                }`}
              >
                <FileText className="h-4.5 w-4.5 shrink-0" />
                {!isLeftSidebarCollapsed && <span className="ml-3 flex-1 text-left">Drafts</span>}
              </button>

              <button
                onClick={() => navigateToTab('sent')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  activeTab === 'sent'
                    ? 'bg-sidebar-active-bg text-sidebar-active-text font-bold'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active-text'
                }`}
              >
                <Send className="h-4.5 w-4.5 shrink-0" />
                {!isLeftSidebarCollapsed && <span className="ml-3 flex-1 text-left">Sent</span>}
              </button>

              <button
                onClick={() => navigateToTab('spam')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  activeTab === 'spam'
                    ? 'bg-sidebar-active-bg text-sidebar-active-text font-bold'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active-text'
                }`}
              >
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                {!isLeftSidebarCollapsed && <span className="ml-3 flex-1 text-left">Spam</span>}
              </button>

              <button
                onClick={() => navigateToTab('trash')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  activeTab === 'trash'
                    ? 'bg-sidebar-active-bg text-sidebar-active-text font-bold'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active-text'
                }`}
              >
                <Clock className="h-4.5 w-4.5 shrink-0" />
                {!isLeftSidebarCollapsed && <span className="ml-3 flex-1 text-left">Trash</span>}
              </button>
            </nav>
          </div>

          {/* Calendar Section */}
          <div className="space-y-1">
            <nav className="space-y-0.5">
              <button
                onClick={() => navigateToTab('calendar')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'bg-sidebar-active-bg text-sidebar-active-text font-bold'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active-text'
                }`}
              >
                <CalendarIcon className="h-4.5 w-4.5 shrink-0" />
                {!isLeftSidebarCollapsed && <span className="ml-3 flex-1 text-left">Calendar</span>}
              </button>
            </nav>
          </div>
        </div>
      </div>

    </aside>
  );
}
