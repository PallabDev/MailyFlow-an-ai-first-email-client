'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AIAssistant from './AIAssistant';
import { useChatStore } from '@/store/chatStore';

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

    // Collapse left sidebar by default on mobile layouts
    if (window.innerWidth < 768) {
      setIsLeftSidebarCollapsed(true);
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

