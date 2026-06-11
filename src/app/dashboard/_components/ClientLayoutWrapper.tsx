'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AIAssistant from './AIAssistant';

type ClientLayoutWrapperProps = {
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string;
  };
  children: React.ReactNode;
};

export default function ClientLayoutWrapper({
  user,
  children,
}: ClientLayoutWrapperProps) {
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FA] text-slate-800 font-sans antialiased">
      {/* 1. LEFT SIDEBAR */}
      <Sidebar
        user={user}
        isLeftSidebarCollapsed={isLeftSidebarCollapsed}
        setIsLeftSidebarCollapsed={setIsLeftSidebarCollapsed}
      />

      {/* 2. MIDDLE CONTENT PANEL */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[#E5E7EB] bg-white">
        <Header user={user} />
        {children}
      </div>

      {/* 3. RIGHT PANEL (AI ASSISTANT CHAT) */}
      <AIAssistant user={user} />
    </div>
  );
}
