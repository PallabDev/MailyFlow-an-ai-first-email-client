'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, Moon, Sun, MessageSquare, Menu } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useChatStore } from '@/store/chatStore';

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
};

export default function Header({
  user,
  projectName,
  isLeftSidebarCollapsed,
  setIsLeftSidebarCollapsed
}: HeaderProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchVal, setSearchVal] = useState(searchParams.get('q') || '');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { theme, setTheme, isRightSidebarCollapsed, setIsRightSidebarCollapsed } = useChatStore();

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
    const params = new URLSearchParams(searchParams.toString());
    if (val.trim()) {
      params.set('q', val);
    } else {
      params.delete('q');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

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
      <div className="flex-1 max-w-lg mx-auto relative">
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

      {/* Right Header Controls */}
      <div className="flex items-center space-x-3 text-slate-500">
        <button
          onClick={toggleAIChat}
          className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer md:hidden flex items-center justify-center ${
            !isRightSidebarCollapsed
              ? 'text-[#6e9b7e] bg-accent-soft/40 dark:bg-accent-soft/10 scale-105'
              : 'text-slate-500 hover:text-foreground hover:bg-sidebar-hover'
          }`}
          title={isRightSidebarCollapsed ? 'Open AI Assistant Chat' : 'Close AI Assistant Chat'}
        >
          <MessageSquare className="h-4.5 w-4.5" />
        </button>

        <button
          onClick={toggleTheme}
          className="p-1.5 hover:bg-sidebar-hover rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-foreground"
          title={theme === 'dark' ? 'Activate Light Mode' : 'Activate Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
        <div className="flex items-center justify-center h-8 w-8">
          <UserButton appearance={theme === 'dark' ? ({ baseTheme: dark } as any) : undefined} />
        </div>
      </div>
    </header>
  );
}

