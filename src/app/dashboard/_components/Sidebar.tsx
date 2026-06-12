'use client';

import React, { useState, useEffect } from 'react';
import { SignOutButton } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import {
  Mail,
  Calendar as CalendarIcon,
  LogOut,
  Inbox as InboxIcon,
  AlertCircle,
  FileText,
  ChevronRight,
  ChevronLeft,
  Send,
  Clock
} from 'lucide-react';

type SidebarProps = {
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string;
  };
  isLeftSidebarCollapsed: boolean;
  setIsLeftSidebarCollapsed: (val: boolean) => void;
};

export default function Sidebar({
  user,
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
    <aside className={`border-r border-[#E5E7EB] bg-[#F4F4F5] flex flex-col justify-between transition-all duration-300 ${
      isLeftSidebarCollapsed ? 'w-16' : 'w-60'
    }`}>
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo & Toggle Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#E5E7EB] bg-white">
          {!isLeftSidebarCollapsed && (
            <div className="flex items-center space-x-2.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <span className="font-bold text-slate-900 tracking-tight text-lg">AgentiFlow</span>
            </div>
          )}
          <button
            onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
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
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <Mail className="h-4.5 w-4.5 shrink-0" />
                {!isLeftSidebarCollapsed && (
                  <span className="ml-3 flex-1 text-left">Inbox</span>
                )}
                {!isLeftSidebarCollapsed && (
                  <span className="text-xs text-slate-500 font-normal bg-slate-300/60 px-2 py-0.5 rounded">
                    {inboxUnread}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigateToTab('drafts')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  activeTab === 'drafts'
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <FileText className="h-4.5 w-4.5 shrink-0" />
                {!isLeftSidebarCollapsed && <span className="ml-3 flex-1 text-left">Drafts</span>}
                {!isLeftSidebarCollapsed && (
                  <span className="text-xs text-slate-500 font-normal bg-slate-300/60 px-2 py-0.5 rounded">
                    {draftsTotal}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigateToTab('sent')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  activeTab === 'sent'
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <Send className="h-4.5 w-4.5 shrink-0" />
                {!isLeftSidebarCollapsed && <span className="ml-3 flex-1 text-left">Sent</span>}
              </button>

              <button
                onClick={() => navigateToTab('spam')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  activeTab === 'spam'
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                {!isLeftSidebarCollapsed && <span className="ml-3 flex-1 text-left">Spam</span>}
                {!isLeftSidebarCollapsed && spamTotal > 0 && (
                  <span className="text-xs text-red-500 font-bold bg-red-100 px-2 py-0.5 rounded">
                    {spamTotal}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigateToTab('trash')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  activeTab === 'trash'
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
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
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <CalendarIcon className="h-4.5 w-4.5 shrink-0" />
                {!isLeftSidebarCollapsed && <span className="ml-3 flex-1 text-left">Calendar</span>}
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Profile & Sign out */}
      <div className="p-3 border-t border-[#E5E7EB] bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={user.imageUrl}
              alt="Profile"
              className="h-8 w-8 rounded-full border border-slate-200"
            />
            {!isLeftSidebarCollapsed && (
              <span className="text-xs font-bold text-slate-700 truncate w-24">
                {user.firstName || 'User'}
              </span>
            )}
          </div>
          
          {!isLeftSidebarCollapsed && (
            <SignOutButton>
              <button className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer">
                <LogOut className="h-4 w-4" />
              </button>
            </SignOutButton>
          )}
        </div>
      </div>
    </aside>
  );
}
