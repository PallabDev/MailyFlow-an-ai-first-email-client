'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, Moon, Sun, Menu, Bell, Check, Trash, SlidersHorizontal } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useChatStore } from '@/store/chatStore';
import { useNotificationStore } from '@/store/notificationStore';
import { formatEmailDate } from '@/utils/emailHelper';
import AISvg from './AISvg';

type HeaderProps = {
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string;
  };
  projectName: string;
  isLeftSidebarCollapsed: boolean;
  setIsLeftSidebarCollapsed: (v: boolean) => void;
  isAdvancedSearchOpen?: boolean;
  setIsAdvancedSearchOpen?: (v: boolean) => void;
};

export default function Header({
  user: _user,
  projectName: _projectName,
  isLeftSidebarCollapsed,
  setIsLeftSidebarCollapsed,
  isAdvancedSearchOpen,
  setIsAdvancedSearchOpen
}: HeaderProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchVal, setSearchVal] = useState(searchParams.get('q') || '');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { theme, setTheme, isRightSidebarCollapsed, setIsRightSidebarCollapsed } = useChatStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (item: any) => {
    markAsRead(item.id);
    setShowNotifications(false);
    
    // Redirect to inbox and open the email
    const base = pathname?.startsWith('/demo') ? '/demo' : '/dashboard';
    router.push(`${base}/inbox?openEmailId=${item.emailId}`);
  };

  const toggleAIChat = () => {
    setIsRightSidebarCollapsed(!isRightSidebarCollapsed);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Focus search input on Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update URL search params on search change
  const handleSearchChange = (val: string) => {
    setSearchVal(val);
  };

  // Debounced URL param updates to prevent focus loss and lag on keystrokes
  useEffect(() => {
    const handler = setTimeout(() => {
      const currentQuery = searchParams.get('q') || '';
      if (searchVal === currentQuery) return;

      const params = new URLSearchParams(searchParams.toString());
      if (searchVal.trim()) {
        params.set('q', searchVal);
      } else {
        params.delete('q');
      }
      const queryStr = params.toString();
      const targetUrl = queryStr ? `${pathname}?${queryStr}` : pathname;
      router.replace(targetUrl, { scroll: false });
    }, 300);

    return () => clearTimeout(handler);
  }, [searchVal, pathname, router, searchParams]);

  return (
    <header className="h-16 border-b border-border flex items-center px-4 md:px-6 bg-card text-foreground shrink-0 transition-colors gap-3 justify-between">
      {/* Hamburger menu for left sidebar toggling on mobile (only shown when sidebar is collapsed) */}
      {isLeftSidebarCollapsed && (
        <button
          onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
          className="p-1.5 hover:bg-sidebar-hover rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-foreground md:hidden flex items-center justify-center shrink-0"
          title="Expand Sidebar"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
      )}

      {/* Centered Search */}
      <div className="flex-1 max-w-lg mx-auto relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            ref={searchInputRef}
            placeholder="Search mail, events, people..."
            value={searchVal}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-background border border-border rounded-xl py-1.5 pl-10 pr-12 text-sm text-foreground placeholder-slate-400 shadow-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all"
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 border border-border bg-background px-1.5 py-0.5 rounded shadow-sm select-none">
            ⌘K
          </kbd>
        </div>
        {setIsAdvancedSearchOpen && (
          <button
            onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              isAdvancedSearchOpen
                ? 'border-success/40 bg-success/10 text-success'
                : 'border-border bg-background text-slate-400 hover:text-foreground hover:border-slate-500'
            }`}
            title="Advanced filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Right Header Controls */}
      <div className="flex items-center space-x-3 text-slate-500">
        {isRightSidebarCollapsed && (
          <button
            onClick={() => setIsRightSidebarCollapsed(false)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 md:px-3 border border-success/30 hover:border-success/60 bg-success/5 hover:bg-success/10 text-success text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm shrink-0"
            title="Open AI Assistant"
          >
            <AISvg className="h-4.5 w-4.5 shrink-0" />
            <span className="hidden md:inline">AI Assistant</span>
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="p-1.5 hover:bg-sidebar-hover rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-foreground"
          title={theme === 'dark' ? 'Activate Light Mode' : 'Activate Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center hover:bg-sidebar-hover hover:text-foreground relative ${
              showNotifications ? 'text-text-primary bg-sidebar-hover' : 'text-slate-500'
            }`}
            title="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-danger animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-[360px] bg-card border border-border rounded-2xl shadow-2xl z-50 py-2 text-text-primary animate-zoom-in">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <span className="font-bold text-xs uppercase tracking-wider text-text-muted">Notifications</span>
                <div className="flex space-x-2 text-[10px] font-bold">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-success hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-text-muted hover:text-danger hover:underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto divide-y divide-border-row">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs font-semibold text-text-muted">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-3 hover:bg-hover-row cursor-pointer transition-colors flex items-start space-x-2 ${
                        !item.read ? 'bg-mail-unread-bg/40 font-medium' : ''
                      }`}
                    >
                      {!item.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0 mt-2" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-text-primary truncate">
                            {item.senderName}
                          </span>
                          <span className="text-[10px] text-text-muted shrink-0 pl-2">
                            {formatEmailDate(item.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary truncate mt-0.5">
                          {item.subject}
                        </p>
                        <p className="text-[10px] text-text-muted truncate mt-0.5">
                          {item.snippet}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center h-8 w-8">
          {pathname?.startsWith('/demo') ? (
            <div className="h-8 w-8 rounded-full bg-success/15 text-success font-semibold flex items-center justify-center text-xs border border-success/25 cursor-pointer select-none" title="Demo Mode Profile">
              D
            </div>
          ) : (
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            <UserButton appearance={theme === 'dark' ? ({ baseTheme: dark } as any) : undefined} />
          )}
        </div>
      </div>
    </header>
  );
}

