'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AIAssistant from './AIAssistant';
import { useChatStore } from '@/store/chatStore';
import { useRouter } from 'next/navigation';

type ClientLayoutWrapperProps = {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string;
  };
  projectName: string;
  children: React.ReactNode;
};

export default function ClientLayoutWrapper({
  user,
  projectName,
  children,
}: ClientLayoutWrapperProps) {
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Only works on desktop mode, not mobile
      if (window.innerWidth < 768) return;

      // 1b. Never block copy/paste/cut/select-all actions
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
        return;
      }

      // 2. Check if typing
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.getAttribute('contenteditable') === 'true'
      );
      if (isTyping) return;

      // Need both Ctrl and Alt modifiers
      if (!e.ctrlKey || !e.altKey) return;

      const key = e.key.toLowerCase();
      let routeTarget = '';

      switch (key) {
        case 'i':
          routeTarget = '/dashboard/inbox';
          break;
        case 's':
          routeTarget = '/dashboard/starred';
          break;
        case 'd':
          routeTarget = '/dashboard/draft';
          break;
        case 't':
          routeTarget = '/dashboard/sent';
          break;
        case 'p':
          routeTarget = '/dashboard/spam';
          break;
        case 'x':
          routeTarget = '/dashboard/trash';
          break;
        case 'c':
          routeTarget = '/dashboard/calendar';
          break;
        case 'g':
          routeTarget = '/dashboard/integrations';
          break;
        case 'b':
          routeTarget = '/dashboard/billing';
          break;
        default:
          break;
      }

      if (routeTarget) {
        e.preventDefault();
        router.push(routeTarget);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  useEffect(() => {
    // Sync settings from localStorage once client has mounted
    const savedTheme = localStorage.getItem('theme');
    const savedWidth = localStorage.getItem('mailyflow-sidebar-width');

    if (savedTheme === 'dark' || savedTheme === 'light') {
      useChatStore.getState().setTheme(savedTheme);
    }
    if (savedWidth) {
      useChatStore.getState().setSidebarWidth(Number(savedWidth));
    }

    // Collapse sidebars by default on mobile layouts
    if (window.innerWidth < 768) {
      setIsLeftSidebarCollapsed(true);
      useChatStore.getState().setIsRightSidebarCollapsed(true);
    }
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      {/* 1. LEFT SIDEBAR */}
      <Sidebar
        projectName={projectName}
        isLeftSidebarCollapsed={isLeftSidebarCollapsed}
        setIsLeftSidebarCollapsed={setIsLeftSidebarCollapsed}
        user={user}
      />

      {/* 2. MIDDLE CONTENT PANEL */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border bg-card">
        <Header
          user={user}
          projectName={projectName}
          isLeftSidebarCollapsed={isLeftSidebarCollapsed}
          setIsLeftSidebarCollapsed={setIsLeftSidebarCollapsed}
        />
        {children}
      </div>

      {/* 3. RIGHT PANEL (AI ASSISTANT CHAT) */}
      <AIAssistant user={user} projectName={projectName} />
    </div>
  );
}

