'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ClientLayoutWrapper from '../../dashboard/_components/ClientLayoutWrapper';
import FolderPageClient from '../../dashboard/_components/FolderPageClient';
import CalendarClient from '../../dashboard/calendar/CalendarClient';
import IntegrationsClient from '../../dashboard/integrations/IntegrationsClient';
import BillingPage from '../../dashboard/billing/page';
import { setupDemoFetchInterceptor } from '../_components/DemoFetchInterceptor';

const demoUser = {
  id: 'demo-user-id',
  firstName: 'Demo',
  lastName: 'User',
  email: 'demo@mailyflow.in',
  imageUrl: '', // Blank image URL triggers initials placeholder
};

export default function DemoCatchAllPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [interceptorReady, setInterceptorReady] = useState(false);
  const [connections, setConnections] = useState({ gmail: true, calendar: true });

  // Handle client-side redirect /demo -> /demo/inbox
  useEffect(() => {
    if (pathname === '/demo' || pathname === '/demo/') {
      router.replace('/demo/inbox');
    }
  }, [pathname, router]);

  // Set up the fetch interceptor
  useEffect(() => {
    // Check if initial connection exists in localStorage, otherwise set default
    const savedConnections = localStorage.getItem('mailyflow_demo_connections');
    if (savedConnections) {
      setConnections(JSON.parse(savedConnections));
    } else {
      localStorage.setItem('mailyflow_demo_connections', JSON.stringify({ gmail: true, calendar: true }));
    }

    const cleanup = setupDemoFetchInterceptor();
    setInterceptorReady(true);

    const handleRefreshLabels = () => {
      const updatedConnections = localStorage.getItem('mailyflow_demo_connections');
      if (updatedConnections) {
        setConnections(JSON.parse(updatedConnections));
      }
    };

    window.addEventListener('refresh-labels', handleRefreshLabels);

    return () => {
      cleanup();
      window.removeEventListener('refresh-labels', handleRefreshLabels);
    };
  }, []);

  if (!interceptorReady || pathname === '/demo' || pathname === '/demo/') {
    return (
      <div className="h-screen w-screen bg-card flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          {/* Custom smooth spinner ring */}
          <div className="h-6 w-6 rounded-full border-2 border-success/30 border-t-success animate-spin"></div>
          <span className="text-xs text-text-secondary font-semibold animate-pulse">Initializing sandbox demo...</span>
        </div>
      </div>
    );
  }

  // Parse path segments to identify active folder/view
  const segments = pathname.split('/').filter(Boolean);
  const activeTab = segments[1] || 'inbox';

  let activeContent = null;

  switch (activeTab) {
    case 'inbox':
      activeContent = (
        <FolderPageClient
          key="inbox"
          folder="inbox"
          title="Inbox"
          initialEmails={[]}
          initialNextPageToken={null}
          emailError={null}
        />
      );
      break;
    case 'starred':
      activeContent = (
        <FolderPageClient
          key="starred"
          folder="starred"
          title="Starred"
          initialEmails={[]}
          initialNextPageToken={null}
          emailError={null}
        />
      );
      break;
    case 'draft':
    case 'drafts':
      activeContent = (
        <FolderPageClient
          key="drafts"
          folder="drafts"
          title="Drafts"
          initialEmails={[]}
          initialNextPageToken={null}
          emailError={null}
        />
      );
      break;
    case 'sent':
      activeContent = (
        <FolderPageClient
          key="sent"
          folder="sent"
          title="Sent"
          initialEmails={[]}
          initialNextPageToken={null}
          emailError={null}
        />
      );
      break;
    case 'spam':
      activeContent = (
        <FolderPageClient
          key="spam"
          folder="spam"
          title="Spam"
          initialEmails={[]}
          initialNextPageToken={null}
          emailError={null}
        />
      );
      break;
    case 'trash':
      activeContent = (
        <FolderPageClient
          key="trash"
          folder="trash"
          title="Trash"
          initialEmails={[]}
          initialNextPageToken={null}
          emailError={null}
        />
      );
      break;
    case 'calendar':
      activeContent = <CalendarClient key="calendar" initialEvents={[]} calendarError={null} />;
      break;
    case 'integrations':
      activeContent = (
        <IntegrationsClient
          key="integrations"
          isGmailConnected={connections.gmail}
          isCalendarConnected={connections.calendar}
          dbError={false}
        />
      );
      break;
    case 'billing':
      activeContent = <BillingPage key="billing" />;
      break;
    default:
      activeContent = (
        <FolderPageClient
          key="inbox"
          folder="inbox"
          title="Inbox"
          initialEmails={[]}
          initialNextPageToken={null}
          emailError={null}
        />
      );
      break;
  }

  return (
    <ClientLayoutWrapper user={demoUser} projectName="MailyFlow (Demo)">
      {activeContent}
    </ClientLayoutWrapper>
  );
}
