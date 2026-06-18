'use client';

interface MockEmail {
  id: string;
  from: string;
  date: string;
  subject: string;
  snippet: string;
  body: string;
  labelIds: string[];
  internalDate: string;
  attachments?: Array<{ name: string; type: string; base64: string; size?: number }>;
}

interface MockEvent {
  id: string;
  summary: string;
  description: string;
  location: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

interface MockChatMessage {
  id: string;
  role: string;
  content: string;
  status: string;
  createdAt: string;
}

export function setupDemoFetchInterceptor() {
  if (typeof window === 'undefined') return () => {};

  const originalFetch = window.fetch;

  // Helper to get clean event title
  const eventPayloadClean = (title: string) => {
    return title.trim().replace(/^\w/, (c) => c.toUpperCase());
  };

  // Predefined initial emails list
  const getMockEmails = () => {
    const data = localStorage.getItem('mailyflow_demo_emails');
    if (data) return JSON.parse(data);

    const initial = [
      {
        id: 'mock-email-1',
        from: 'Google Security <no-reply@accounts.google.com>',
        date: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
        subject: 'Security alert: MailyFlow connection',
        snippet: 'Your Google Account was successfully linked to MailyFlow. You can now manage your emails and calendar...',
        body: 'Hello,\n\nWe wanted to inform you that your Google Account was successfully connected to MailyFlow. This authorization allows MailyFlow to read, draft, and organize your emails, and manage your Google Calendar events.\n\nIf you did not authorize this connection, please review your account activity.\n\nBest regards,\nThe Google Accounts team',
        labelIds: ['INBOX'],
        internalDate: String(Date.now() - 30 * 60 * 1000),
      },
      {
        id: 'mock-email-2',
        from: 'Sarah Jenkins <sarah.j@acme-corp.com>',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        subject: 'Q3 Investor Update & Projections',
        snippet: "Hi Team, please find attached our initial outline for the Q3 update. I'd love your feedback on the...",
        body: "Hi Team,\n\nI hope you're doing well. I've compiled the draft numbers for the Q3 investor update. We are looking at a 15% quarter-over-quarter growth in SaaS subscriptions, mostly driven by our new integration features.\n\nCould you review the slide deck and let me know if you agree with the projections by tomorrow EOD?\n\nSlide deck: https://docs.google.com/presentation/d/acme-q3-draft\n\nThanks,\nSarah Jenkins\nDirector of Operations, Acme Corp",
        labelIds: ['INBOX', 'UNREAD'],
        internalDate: String(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: 'mock-email-3',
        from: 'David Chen <david@capital-ventures.com>',
        date: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
        subject: 'Follow-up: Meeting schedule next week',
        snippet: "Great connecting yesterday! Let's lock in a time next week to discuss the Pro tier expansion and marketing budget...",
        body: "Hi,\n\nIt was great speaking with you yesterday about the expansion plans. I'm excited about the MailyFlow product roadmap.\n\nLet's lock in a 30-minute sync next week. I'm generally free on Tuesday morning or Wednesday afternoon. Let me know what works best for you and your team.\n\nBest,\nDavid Chen\nPartner, Capital Ventures",
        labelIds: ['INBOX'],
        internalDate: String(Date.now() - 18 * 60 * 60 * 1000),
      },
      {
        id: 'mock-email-4',
        from: 'MailyFlow Support <support@mailyflow.in>',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        subject: 'Welcome to MailyFlow!',
        snippet: 'Welcome aboard! Here are 3 quick tips to get started with your AI email executive...',
        body: "Welcome to MailyFlow!\n\nWe are thrilled to have you onboard. MailyFlow is built to make your email and calendar work for you, not the other way around. Here are 3 quick tips to get started:\n\n1. Ask the AI assistant to 'draft a polite reply to Sarah's email'.\n2. Try asking 'schedule a meeting with David on Wednesday at 3 PM'.\n3. Set up custom rules in the Integrations tab.\n\nNeed help? Just reply to this email or visit our help center.\n\nCheers,\nThe MailyFlow Team",
        labelIds: ['INBOX'],
        internalDate: String(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'mock-email-5',
        from: 'Acme Corp HR <hr@acme-corp.com>',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        subject: 'Draft: Employee feedback policy review',
        snippet: 'Attached is the proposed revision for the employee review guidelines...',
        body: 'Draft employee review guidelines:\n\nPlease review the updated employee guidelines before we submit it to the board next week.',
        labelIds: ['DRAFT'],
        internalDate: String(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'mock-email-6',
        from: 'Google Workspace <workspace-promo@google.com>',
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
        subject: 'Grow your business with Google Workspace',
        snippet: 'Get custom email, online storage, and more...',
        body: 'Get more out of Google Workspace with custom email, cloud storage, and security features.',
        labelIds: ['SPAM'],
        internalDate: String(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
    ];

    localStorage.setItem('mailyflow_demo_emails', JSON.stringify(initial));
    return initial;
  };

  const saveMockEmails = (emails: MockEmail[]) => {
    localStorage.setItem('mailyflow_demo_emails', JSON.stringify(emails));
  };

  // Predefined calendar events relative to current date
  const getMockEvents = () => {
    const data = localStorage.getItem('mailyflow_demo_events');
    if (data) return JSON.parse(data);

    const today = new Date();
    const getRelativeDateString = (daysOffset: number, hoursOffset: number, minutesOffset = 0) => {
      const d = new Date(today);
      d.setDate(today.getDate() + daysOffset);
      d.setHours(hoursOffset);
      d.setMinutes(minutesOffset);
      d.setSeconds(0);
      d.setMilliseconds(0);
      return d.toISOString();
    };

    const initial = [
      {
        id: 'mock-event-1',
        summary: 'Q3 Strategy Planning',
        description: 'Review Q3 projections with Sarah and Acme team.',
        location: 'Google Meet',
        start: { dateTime: getRelativeDateString(0, 14, 0) }, // Today at 2 PM
        end: { dateTime: getRelativeDateString(0, 15, 0) }, // Today at 3 PM
      },
      {
        id: 'mock-event-2',
        summary: 'Sync with David (Capital Ventures)',
        description: 'Discuss MailyFlow Pro tier expansion plans.',
        location: 'Zoom Link',
        start: { dateTime: getRelativeDateString(1, 10, 0) }, // Tomorrow at 10 AM
        end: { dateTime: getRelativeDateString(1, 11, 0) },
      },
      {
        id: 'mock-event-3',
        summary: 'Weekly Team Sync',
        description: 'Align on weekly developer sprint goals.',
        location: 'Slack Huddle',
        start: { dateTime: getRelativeDateString(4, 9, 0) }, // 4 days from now at 9 AM
        end: { dateTime: getRelativeDateString(4, 9, 30) },
      },
    ];

    localStorage.setItem('mailyflow_demo_events', JSON.stringify(initial));
    return initial;
  };

  const saveMockEvents = (events: MockEvent[]) => {
    localStorage.setItem('mailyflow_demo_events', JSON.stringify(events));
  };

  // Predefined assistant chat history
  const getMockChatHistory = () => {
    const data = localStorage.getItem('mailyflow_demo_chat');
    if (data) return JSON.parse(data);

    const initial = [
      {
        id: 'mock-chat-1',
        role: 'assistant',
        content:
          "👋 Hello! Welcome to MailyFlow.\n\nI am your AI assistant. Since this is an interactive demo, I will process actions client-side directly against your local mock data. Try asking me:\n- **\"Schedule a design sync\"**\n- **\"Draft a reply to Sarah\"**\n- **\"List investor emails\"**",
        status: 'completed',
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
    ];

    localStorage.setItem('mailyflow_demo_chat', JSON.stringify(initial));
    return initial;
  };

  const saveMockChatHistory = (history: MockChatMessage[]) => {
    localStorage.setItem('mailyflow_demo_chat', JSON.stringify(history));
  };

  const filterEmails = (emails: MockEmail[], folder: string) => {
    return emails.filter((email) => {
      const labels = email.labelIds || [];
      if (folder === 'inbox') return labels.includes('INBOX');
      if (folder === 'starred') return labels.includes('STARRED');
      if (folder === 'drafts') return labels.includes('DRAFT');
      if (folder === 'sent') return labels.includes('SENT');
      if (folder === 'spam') return labels.includes('SPAM');
      if (folder === 'trash') return labels.includes('TRASH');
      return true;
    });
  };

  // Overriding fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = input.toString();
    const url = new URL(urlStr, window.location.origin);
    const path = url.pathname;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsonResponse = (data: any, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    // 1. GET /api/labels
    if (path === '/api/labels') {
      const connections = JSON.parse(
        localStorage.getItem('mailyflow_demo_connections') || '{"gmail":true,"calendar":true}'
      );
      return jsonResponse({ connections });
    }

    // 2. GET /api/emails
    if (path === '/api/emails' && init?.method !== 'POST') {
      const folder = url.searchParams.get('folder') || 'inbox';
      const q = url.searchParams.get('q') || '';
      const emails = getMockEmails();
      let filtered = filterEmails(emails, folder);

      if (q.trim()) {
        const query = q.toLowerCase();
        filtered = filtered.filter(
          (e: MockEmail) =>
            e.subject.toLowerCase().includes(query) ||
            e.from.toLowerCase().includes(query) ||
            e.body.toLowerCase().includes(query)
        );
      }

      return jsonResponse({
        emails: filtered,
        nextPageToken: null,
      });
    }

    // 3. GET /api/emails/detail
    if (path === '/api/emails/detail') {
      const id = url.searchParams.get('id');
      const emails = getMockEmails();
      const email = emails.find((e: MockEmail) => e.id === id);
      if (email) {
        return jsonResponse(email);
      }
      return jsonResponse({ error: 'Email not found' }, 404);
    }

    // 4. POST /api/star-email
    if (path === '/api/star-email') {
      const body = JSON.parse((init?.body as string) || '{}');
      const { id, starred } = body;
      const emails = getMockEmails();
      const updated = emails.map((e: MockEmail) => {
        if (e.id === id) {
          const currentLabels = e.labelIds || [];
          const nextLabels = starred
            ? [...currentLabels.filter((l: string) => l !== 'STARRED'), 'STARRED']
            : currentLabels.filter((l: string) => l !== 'STARRED');
          return { ...e, labelIds: nextLabels };
        }
        return e;
      });
      saveMockEmails(updated);
      return jsonResponse({ success: true });
    }

    // 5. POST /api/trash-email
    if (path === '/api/trash-email') {
      const body = JSON.parse((init?.body as string) || '{}');
      const { id, permanently } = body;
      const emails = getMockEmails();

      let updated;
      if (permanently) {
        updated = emails.filter((e: MockEmail) => e.id !== id);
      } else {
        updated = emails.map((e: MockEmail) => {
          if (e.id === id) {
            const nextLabels = (e.labelIds || []).filter((l: string) => l !== 'INBOX' && l !== 'DRAFT' && l !== 'SENT');
            if (!nextLabels.includes('TRASH')) nextLabels.push('TRASH');
            return { ...e, labelIds: nextLabels };
          }
          return e;
        });
      }
      saveMockEmails(updated);
      return jsonResponse({ success: true });
    }

    // 6. POST /api/send-email
    if (path === '/api/send-email') {
      const body = JSON.parse((init?.body as string) || '{}');
      const { to, subject, body: emailBody } = body;
      const emails = getMockEmails();

      const newEmail = {
        id: `mock-email-${Date.now()}`,
        from: 'Demo User <demo@mailyflow.in>',
        date: new Date().toISOString(),
        subject,
        snippet: emailBody.substring(0, 60),
        body: emailBody,
        labelIds: ['SENT'],
        internalDate: String(Date.now()),
        attachments: body.attachments || [],
      };

      const updated = [newEmail, ...emails];
      saveMockEmails(updated);

      // Instantly dispatch event to prepend locally in client
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('mailyflow-demo-new-email', { detail: { emailId: newEmail.id } })
        );
      }, 50);

      // Simulate a premium automated reply after 3 seconds
      setTimeout(() => {
        const replyEmail = {
          id: `mock-email-reply-${Date.now()}`,
          from: to || 'Sarah Jenkins <sarah.j@acme-corp.com>',
          date: new Date().toISOString(),
          subject: subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`,
          snippet: `Thanks for writing back! I received your response. Let's sync up soon.`,
          body: `Thanks for writing back!\n\nI have received your response regarding "${subject}". We will check this with the team and get back to you shortly.\n\nBest,\nSarah Jenkins`,
          labelIds: ['INBOX', 'UNREAD'],
          internalDate: String(Date.now()),
        };
        const currentEmails = getMockEmails();
        saveMockEmails([replyEmail, ...currentEmails]);
        window.dispatchEvent(new CustomEvent('refresh-labels'));
        window.dispatchEvent(
          new CustomEvent('mailyflow-demo-new-email', { detail: { emailId: replyEmail.id } })
        );
      }, 3000);

      return jsonResponse({ success: true });
    }

    // 7. POST /api/save-draft
    if (path === '/api/save-draft') {
      const body = JSON.parse((init?.body as string) || '{}') as { to?: string; subject: string; body: string; attachments?: Array<{ name: string; type: string; base64: string; size?: number }> };
      const _to = body.to;
      const emails = getMockEmails();

      const newDraft = {
        id: `mock-email-draft-${Date.now()}`,
        from: 'Demo User <demo@mailyflow.in>',
        date: new Date().toISOString(),
        subject: body.subject,
        snippet: body.body.substring(0, 60),
        body: body.body,
        labelIds: ['DRAFT'],
        internalDate: String(Date.now()),
        attachments: body.attachments || [],
      };

      const updated = [newDraft, ...emails];
      saveMockEmails(updated);

      // Prepend to UI list instantly
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('mailyflow-demo-new-email', { detail: { emailId: newDraft.id } })
        );
      }, 50);

      return jsonResponse({ success: true });
    }

    // 8. GET /api/calendar
    if (path === '/api/calendar' && init?.method !== 'POST' && init?.method !== 'PUT' && init?.method !== 'DELETE') {
      const events = getMockEvents();
      return jsonResponse({ events });
    }

    // 9. POST /api/calendar
    if (path === '/api/calendar' && init?.method === 'POST') {
      const body = JSON.parse((init?.body as string) || '{}');
      const eventPayload = body.event;
      const events = getMockEvents();

      const newEvent = {
        id: `mock-event-${Date.now()}`,
        ...eventPayload,
      };

      saveMockEvents([...events, newEvent]);
      return jsonResponse({ success: true });
    }

    // 10. PUT /api/calendar
    if (path === '/api/calendar' && init?.method === 'PUT') {
      const body = JSON.parse((init?.body as string) || '{}');
      const { id, event: eventPayload } = body;
      const events = getMockEvents();

      const updated = events.map((ev: MockEvent) => (ev.id === id ? { ...ev, ...eventPayload } : ev));
      saveMockEvents(updated);
      return jsonResponse({ success: true });
    }

    // 11. DELETE /api/calendar
    if (path === '/api/calendar' && init?.method === 'DELETE') {
      const id = url.searchParams.get('id');
      const events = getMockEvents();
      const updated = events.filter((ev: MockEvent) => ev.id !== id);
      saveMockEvents(updated);
      return jsonResponse({ success: true });
    }

    // 12. GET /api/billing/status
    if (path === '/api/billing/status') {
      const planName = localStorage.getItem('mailyflow_demo_billing_plan') || 'Professional';
      const status = localStorage.getItem('mailyflow_demo_billing_status') || 'active';
      return jsonResponse({
        subscription: {
          planName,
          status,
          price: planName === 'Starter' ? 'Free' : planName === 'Professional' ? '₹599' : '₹999',
          startDate: '2026-06-01T00:00:00Z',
          endDate: '2026-07-01T00:00:00Z',
        },
        usage: {
          ai: 12,
          gmail: 45,
          calendar: 18,
          limits: {
            aiLimit: planName === 'Starter' ? 10 : planName === 'Professional' ? 30 : 100,
            gmailLimit: 500,
            calendarLimit: 500,
          },
        },
      });
    }

    // 13. POST /api/chat (AI completing start)
    if (path === '/api/chat' && init?.method === 'POST') {
      const body = JSON.parse((init?.body as string) || '{}');
      const { messages } = body;
      const userMsg = messages[messages.length - 1];

      const chatHistory = getMockChatHistory();

      const userMessageId = `mock-user-msg-${Date.now()}`;
      const assistantMessageId = `mock-assistant-msg-${Date.now()}`;

      const userMsgObj = {
        id: userMessageId,
        role: 'user',
        content: userMsg.content,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };

      const assistantMsgObj = {
        id: assistantMessageId,
        role: 'assistant',
        content: 'Thinking...',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      const updated = [...chatHistory, userMsgObj, assistantMsgObj];
      saveMockChatHistory(updated);

      // Simulate multi-stage thinking steps to showcase the AgentProgressLoader!
      // Step 1: Thinking progress content updates after 1 second
      setTimeout(() => {
        const history = getMockChatHistory();
        const updatedHistory = history.map((m: MockChatMessage) => {
          if (m.id === assistantMessageId) {
            return {
              ...m,
              content: 'Analyzing your mailbox history and active connections...',
            };
          }
          return m;
        });
        saveMockChatHistory(updatedHistory);
      }, 1200);

      // Step 2: Final reply resolves and updates status after 3.2 seconds
      setTimeout(() => {
        const history = getMockChatHistory();
        const updatedHistory = history.map((m: MockChatMessage) => {
            if (m.id === assistantMessageId) {
            const prompt = userMsg.content.toLowerCase();
            let finalReply = '';

            // Simulated AI operations based on user keywords
            if (
              prompt.includes('schedule') ||
              prompt.includes('calendar') ||
              prompt.includes('meeting') ||
              prompt.includes('appointment')
            ) {
              const eventTitle =
                prompt.match(/(?:meeting|schedule)\s+([a-zA-Z0-9\s]+?)(?:\s+on|\s+at|\s+with|$)/i)?.[1] ||
                'Sync meeting';
              const newEvent = {
                id: `mock-event-${Date.now()}`,
                summary: eventPayloadClean(eventTitle),
                description: 'Scheduled automatically via MailyFlow AI Assistant in demo mode.',
                location: 'Google Meet',
                start: { dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() }, // 2 hours from now
                end: { dateTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString() },
              };
              const events = getMockEvents();
              saveMockEvents([...events, newEvent]);

              finalReply = `📅 **Scheduled Calendar Event!**\n\nI have successfully scheduled the event **"${eventPayloadClean(
                eventTitle
              )}"** in your Google Calendar:\n- **Time**: Today, 2 hours from now\n- **Location**: Google Meet\n\nYou can click on the **Calendar** tab in the sidebar to verify that the event has appeared in your calendar grid!`;
            } else if (prompt.includes('draft') || prompt.includes('reply') || prompt.includes('write')) {
              finalReply = `✍️ **Draft Response Ready!**\n\nI have created a draft response in your mailbox regarding Sarah's Q3 updates:\n\n*\"Hi Sarah, thanks for the outline. The SaaS growth numbers look solid. Let's lock in the Wednesday slide deck review.\"*\n\nWould you like me to send this draft? (Click **Compose** or check **Drafts** to send it.)`;
            } else if (prompt.includes('hello') || prompt.includes('hi') || prompt.includes('hey')) {
              finalReply = `👋 Hello! I am your **MailyFlow AI Assistant**.\n\nSince this is an interactive demo, I am running completely in your browser on simulated data to protect costs. You can ask me to:\n- **Schedule a meeting** (e.g. *\"Schedule a Sync meeting\"*)\n- **Draft a reply** (e.g. *\"Draft a reply to Sarah\"*)\n- **List emails** (e.g. *\"List all my unread investor updates\"*)\n\nGive it a try!`;
            } else {
              finalReply = `💡 **Demo AI Copilot Assistant**\n\nI received your query: *"${userMsg.content}"*.\n\nIn this offline demo, I simulate agent actions. If you ask me to schedule meetings or draft emails, I will carry them out and immediately reflect the changes in your local inbox or calendar view. Try asking me: *\"schedule a meeting with Sarah\"*!`;
            }

            return {
              ...m,
              content: finalReply,
              status: 'completed',
            };
          }
          return m;
        });
        saveMockChatHistory(updatedHistory);
      }, 3500);

      return jsonResponse({
        success: true,
        userMessageId,
        assistantMessageId,
      });
    }

    // 14. GET /api/chat?userId=...
    if (path === '/api/chat') {
      const messages = getMockChatHistory();
      return jsonResponse({ messages });
    }

    // 15. PUT /api/chat (cancel)
    if (path === '/api/chat' && init?.method === 'PUT') {
      const body = JSON.parse((init?.body as string) || '{}');
      const { messageId } = body;
      const history = getMockChatHistory();
      const updated = history.map((m: MockChatMessage) =>
        m.id === messageId
          ? {
              ...m,
              status: 'cancelled',
              content: '⚠️ AI Request paused and cancelled by user.',
            }
          : m
      );
      saveMockChatHistory(updated);
      return jsonResponse({ success: true });
    }

    // 16. POST /api/emails/summarize
    if (path === '/api/emails/summarize' && init?.method === 'POST') {
      const planName = localStorage.getItem('mailyflow_demo_billing_plan') || 'Professional';
      if (planName === 'Starter') {
        return jsonResponse({ error: 'Upgrade required. Summarization is a paid feature.' }, 403);
      }
      
      const body = JSON.parse((init?.body as string) || '{}');
      const { emailId } = body;
      
      // Simulate asynchronous background Inngest push after 1.5 seconds
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('mailyflow-demo-summary-ready', {
            detail: {
              emailId,
              summary: `📢 **What is happening:**\nThis is a simulated demo email summary generated in the offline sandbox.\n\n👉 **What you need to do:**\n• Explore the interactive dashboard tabs\n• Test the AI Assistant chat sidebar`,
            }
          })
        );
      }, 1500);
      
      return jsonResponse({ success: true });
    }

    // 17. POST /api/emails/draft-reply
    if (path === '/api/emails/draft-reply' && init?.method === 'POST') {
      const planName = localStorage.getItem('mailyflow_demo_billing_plan') || 'Professional';
      if (planName === 'Starter') {
        return jsonResponse({ error: 'Upgrade required. AI reply drafting is a paid feature.' }, 403);
      }

      const body = JSON.parse((init?.body as string) || '{}');
      const { emailId } = body;

      // Simulate asynchronous background Inngest push after 1.5 seconds
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('mailyflow-demo-draft-ready', {
            detail: {
              emailId,
              text: `Hi,\n\nThanks for reaching out! This is a mockup of the context-aware AI response generated automatically in offline demo mode. Let me know if you would like to schedule a review next week.\n\nBest regards,\nDemo User`
            }
          })
        );
      }, 1500);
      
      return jsonResponse({ success: true });
    }

    // Default: Fallback to real network request
    return originalFetch(input, init);
  };

  return () => {
    window.fetch = originalFetch;
  };
}
