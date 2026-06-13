'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, Moon, Sun, Bell, Settings } from 'lucide-react';

type HeaderProps = {
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string;
  };
  projectName: string;
};

export default function Header({ user, projectName }: HeaderProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchVal, setSearchVal] = useState(searchParams.get('q') || '');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme as 'light' | 'dark');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
    }
    return user.firstName ? user.firstName.slice(0, 2).toUpperCase() : 'US';
  };

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card text-foreground shrink-0 transition-colors">
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
          onClick={toggleTheme}
          className="p-1.5 hover:bg-sidebar-hover rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-foreground"
          title={theme === 'dark' ? 'Activate Light Mode' : 'Activate Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
        <button className="p-1.5 hover:bg-sidebar-hover rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-foreground" title="Notifications">
          <Bell className="h-4.5 w-4.5" />
        </button>
        <button className="p-1.5 hover:bg-sidebar-hover rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-foreground" title="Settings">
          <Settings className="h-4.5 w-4.5" />
        </button>
        <div className="h-8 w-8 rounded-full bg-sidebar-active-bg flex items-center justify-center text-xs font-bold border border-border text-foreground">
          {getInitials()}
        </div>
      </div>
    </header>
  );
}

