'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AIAssistant from './AIAssistant';
import { useChatStore } from '@/store/chatStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEmailSocket } from '@/hooks/useEmailSocket';
import { useNotificationStore } from '@/store/notificationStore';
import ComposeModal from './ComposeModal';

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
  const pathname = usePathname();

  // Centralized new email notification handler
  const handleNewEmailReceived = async (emailId: string) => {
    try {
      const res = await fetch(`/api/emails/detail?id=${emailId}`);
      if (res.ok) {
        const data = await res.json();
        // Add to notifications store
        useNotificationStore.getState().addNotification(data);
        // Propagate prepend event to FolderPageClient
        window.dispatchEvent(
          new CustomEvent('mailyflow-new-email-prepend', { detail: { email: data } })
        );
      }
    } catch (err) {
      console.error('Error handling global new email event:', err);
    }
  };

  // 1. Listen for real-time socket updates
  useEmailSocket({ onNewEmail: handleNewEmailReceived });

  // 2. Listen for demo sandbox mock emails
  useEffect(() => {
    const handleDemoEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.emailId) {
        handleNewEmailReceived(customEvent.detail.emailId);
      }
    };
    window.addEventListener('mailyflow-demo-new-email', handleDemoEvent);
    return () => {
      window.removeEventListener('mailyflow-demo-new-email', handleDemoEvent);
    };
  }, []);

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
      const base = pathname?.startsWith('/demo') ? '/demo' : '/dashboard';
      let routeTarget = '';

      switch (key) {
        case 'i':
          routeTarget = `${base}/inbox`;
          break;
        case 's':
          routeTarget = `${base}/starred`;
          break;
        case 'd':
          routeTarget = `${base}/draft`;
          break;
        case 't':
          routeTarget = `${base}/sent`;
          break;
        case 'p':
          routeTarget = `${base}/spam`;
          break;
        case 'x':
          routeTarget = `${base}/trash`;
          break;
        case 'c':
          routeTarget = `${base}/calendar`;
          break;
        case 'g':
          routeTarget = `${base}/integrations`;
          break;
        case 'b':
          routeTarget = `${base}/billing`;
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

      {/* 4. GLOBAL DRAGGABLE/MINIMIZABLE COMPOSE PANEL */}
      <ComposeModal />
    </div>
  );
}

