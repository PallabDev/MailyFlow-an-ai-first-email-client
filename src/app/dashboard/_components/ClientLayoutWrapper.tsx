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
    let gPressed = false;
    let timer: NodeJS.Timeout | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Only works on desktop mode, not mobile
      if (window.innerWidth < 768) return;

      // 2. Check if typing
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.getAttribute('contenteditable') === 'true'
      );
      if (isTyping) return;

      const key = e.key.toLowerCase();

      if (key === 'g') {
        gPressed = true;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          gPressed = false;
        }, 1500);
        return;
      }

      if (gPressed) {
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
          default:
            break;
        }

        if (routeTarget) {
          e.preventDefault();
          gPressed = false;
          if (timer) clearTimeout(timer);
          router.push(routeTarget);
        } else {
          gPressed = false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timer) clearTimeout(timer);
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

