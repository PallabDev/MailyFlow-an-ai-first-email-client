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
  Clock,
  Link2,
  CreditCard,
  X
} from 'lucide-react';

type SidebarProps = {
  projectName: string;
  isLeftSidebarCollapsed: boolean;
  setIsLeftSidebarCollapsed: (val: boolean) => void;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string;
  };
};

export default function Sidebar({
  projectName,
  isLeftSidebarCollapsed,
  setIsLeftSidebarCollapsed,
  user,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active folder based on pathname
  const lastSegment = pathname.split('/').pop() || 'inbox';
  const activeTab = (lastSegment === 'draft' || lastSegment === 'drafts') ? 'drafts' : lastSegment;

  const [inboxUnread, setInboxUnread] = useState(0);
  const [draftsTotal, setDraftsTotal] = useState(0);
  const [spamTotal, setSpamTotal] = useState(0);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          setGmailConnected(data.connections?.gmail ?? false);
          setCalendarConnected(data.connections?.calendar ?? false);
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
    // Auto-collapse sidebar on mobile clicks
    if (window.innerWidth < 768) {
      setIsLeftSidebarCollapsed(true);
    }
  };

  return (
    <aside className={`bg-sidebar-bg text-sidebar-text flex flex-col justify-between transition-all duration-300 ${
      isMobile
        ? isLeftSidebarCollapsed
          ? 'fixed inset-y-0 left-0 z-[100] w-0 border-r-0 overflow-hidden'
          : 'fixed inset-0 z-[100] w-full h-full border-r-0'
        : isLeftSidebarCollapsed
          ? 'relative z-30 w-16 border-r border-sidebar-border'
          : 'relative z-30 w-60 border-r border-sidebar-border'
    }`}>
      {/* Absolute-positioned Symmetrical Toggle Button (hidden on mobile, visible on desktop) */}
      {!isMobile && (
        <button
          onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
          className="absolute -right-3 top-4 p-1 rounded-full border border-border dark:border-[#3e3e3a] bg-card text-text-secondary hover:text-text-primary hover:bg-hover-row hover:scale-105 transition-all shadow-md z-50 cursor-pointer flex items-center justify-center h-7 w-7"
          title={isLeftSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isLeftSidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      )}

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden w-full">
        {/* Logo Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-sidebar-border bg-card">
          {!isLeftSidebarCollapsed ? (
            <>
              <div className="flex items-center space-x-2.5">
                <img src="/icon.png" alt="Logo" className="h-6 w-6 object-contain shrink-0" />
                <span className="font-bold text-card-foreground tracking-tight text-lg">{projectName}</span>
              </div>
              {/* Close button inside sidebar on mobile */}
              <button
                onClick={() => setIsLeftSidebarCollapsed(true)}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-sidebar-hover hover:text-text-primary transition-colors cursor-pointer md:hidden flex items-center justify-center"
                title="Collapse Sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center">
              <img src="/icon.png" alt="Logo" className="h-6 w-6 object-contain shrink-0" />
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          {/* Workspace Group */}
          <div className="space-y-1">
            {!isLeftSidebarCollapsed && (
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Workspace</span>
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

          {/* Settings Group */}
          <div className="space-y-1">
            {!isLeftSidebarCollapsed && (
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Settings</span>
              </div>
            )}
            <nav className="space-y-0.5">
              <button
                onClick={() => navigateToTab('integrations')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  activeTab === 'integrations'
                    ? 'bg-sidebar-active-bg text-sidebar-active-text font-bold'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active-text'
                }`}
              >
                <Link2 className="h-4.5 w-4.5 shrink-0" />
                {!isLeftSidebarCollapsed && <span className="ml-3 flex-1 text-left">Integrations</span>}
              </button>

              <button
                onClick={() => navigateToTab('billing')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  activeTab === 'billing'
                    ? 'bg-sidebar-active-bg text-sidebar-active-text font-bold'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active-text'
                }`}
              >
                <CreditCard className="h-4.5 w-4.5 shrink-0" />
                {!isLeftSidebarCollapsed && <span className="ml-3 flex-1 text-left">Billing</span>}
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Premium Sidebar Footer */}
      <div className="border-t border-sidebar-border bg-card p-3 shrink-0">
        {!isLeftSidebarCollapsed ? (
          <div className="space-y-3">
            {/* Connection Status Section */}
            <div className="rounded-xl bg-sidebar-bg p-2.5 border border-sidebar-border space-y-2">
              <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase block">Connections</span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary font-medium flex items-center">
                  <span className={`w-1.5 h-1.5 rounded-full mr-2 ${gmailConnected ? 'bg-success' : 'bg-slate-400'}`}></span>
                  Gmail
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${gmailConnected ? 'bg-success/15 text-success' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {gmailConnected ? 'Active' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary font-medium flex items-center">
                  <span className={`w-1.5 h-1.5 rounded-full mr-2 ${calendarConnected ? 'bg-success' : 'bg-slate-400'}`}></span>
                  Calendar
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${calendarConnected ? 'bg-success/15 text-success' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {calendarConnected ? 'Active' : 'Offline'}
                </span>
              </div>
            </div>
            
            {/* User Profile Info */}
            <div className="flex items-center space-x-2.5 pt-1">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="h-8 w-8 rounded-full border border-border" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-accent/15 text-accent font-semibold flex items-center justify-center text-xs">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-card-foreground truncate leading-tight">
                  {user?.firstName || 'User'}
                </p>
                <p className="text-[10px] text-text-secondary truncate leading-none mt-0.5">
                  {user?.email || ''}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1">
            {/* User Profile Mini */}
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="Profile" className="h-6 w-6 rounded-full border border-border" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-accent/15 text-accent font-semibold flex items-center justify-center text-[10px]">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        )}
      </div>

    </aside>
  );
}
