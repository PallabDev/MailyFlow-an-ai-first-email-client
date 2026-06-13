import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
}

interface ChatState {
  messages: ChatMessage[];
  chatLoading: boolean;
  chatInput: string;
  isPaused: boolean;
  sidebarWidth: number;
  pollingIntervalId: NodeJS.Timeout | null;
  fetchMessages: (userId: string) => Promise<void>;
  sendMessage: (
    text: string,
    userId: string,
    timezone: string,
    localTime: string,
    userDetails: {
      firstName: string | null;
      lastName: string | null;
      email: string;
      hasGmailConnection: boolean;
      hasCalendarConnection: boolean;
    }
  ) => Promise<void>;
  cancelRequest: (assistantMessageId: string) => Promise<void>;
  setSidebarWidth: (width: number) => void;
  setChatInput: (input: string) => void;
  clearPolling: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  chatLoading: false,
  chatInput: '',
  isPaused: false,
  sidebarWidth: typeof window !== 'undefined' ? Number(localStorage.getItem('mailyflow-sidebar-width')) || 360 : 360,
  pollingIntervalId: null,

  setChatInput: (input) => set({ chatInput: input }),

  setSidebarWidth: (width) => {
    const clampedWidth = Math.max(280, Math.min(width, 600));
    if (typeof window !== 'undefined') {
      localStorage.setItem('mailyflow-sidebar-width', String(clampedWidth));
    }
    set({ sidebarWidth: clampedWidth });
  },

  clearPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      set({ pollingIntervalId: null });
    }
  },

  fetchMessages: async (userId) => {
    try {
      const res = await fetch(`/api/chat?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        set({ messages: data.messages || [] });
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  },

  sendMessage: async (text, userId, timezone, localTime, userDetails) => {
    if (!text.trim()) return;

    // Clear any existing polling
    get().clearPolling();

    const tempUserMsgId = `temp-user-${Date.now()}`;
    const tempAssistantMsgId = `temp-assistant-${Date.now()}`;

    // Optimistically insert user message and pending assistant message
    const newMessages: ChatMessage[] = [
      ...get().messages,
      {
        id: tempUserMsgId,
        role: 'user',
        content: text,
        status: 'completed',
        createdAt: new Date().toISOString(),
      },
      {
        id: tempAssistantMsgId,
        role: 'assistant',
        content: '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ];

    set({
      messages: newMessages,
      chatLoading: true,
      chatInput: '',
      isPaused: false,
    });

    try {
      // Trigger the background AI call process via POST
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: get().messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
          timezone,
          localTime,
          userDetails,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to post chat message');
      }

      const data = await res.json();
      const actualUserMsgId = data.userMessageId;
      const actualAssistantMsgId = data.assistantMessageId;

      // Update temporary IDs with the ones returned from the database
      set((state) => ({
        messages: state.messages.map((m) => {
          if (m.id === tempUserMsgId) return { ...m, id: actualUserMsgId };
          if (m.id === tempAssistantMsgId) return { ...m, id: actualAssistantMsgId };
          return m;
        }),
      }));

      // Start polling for the assistant's reply
      const intervalId = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/chat?userId=${encodeURIComponent(userId)}`);
          if (pollRes.ok) {
            const pollData = await pollRes.json();
            const serverMessages = pollData.messages || [];
            
            // Find the active assistant message from the server response
            const targetMsg = serverMessages.find((m: ChatMessage) => m.id === actualAssistantMsgId);
            
            if (targetMsg) {
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === actualAssistantMsgId ? targetMsg : m
                ),
              }));

              if (targetMsg.status !== 'pending') {
                get().clearPolling();
                set({ chatLoading: false });
              }
            }
          }
        } catch (pollErr) {
          console.error('Error polling chat status:', pollErr);
        }
      }, 1000);

      set({ pollingIntervalId: intervalId });
    } catch (error) {
      console.error('Error posting message:', error);
      get().clearPolling();
      set((state) => ({
        chatLoading: false,
        messages: state.messages.map((m) =>
          m.id === tempAssistantMsgId
            ? {
                ...m,
                status: 'failed',
                content: '⚠️ Failed to send message. Please check your connection.',
              }
            : m
        ),
      }));
    }
  },

  cancelRequest: async (assistantMessageId) => {
    get().clearPolling();

    set((state) => ({
      chatLoading: false,
      isPaused: true,
      messages: state.messages.map((m) =>
        m.id === assistantMessageId
          ? {
              ...m,
              status: 'cancelled',
              content: '⚠️ AI Request paused and cancelled by user.',
            }
          : m
      ),
    }));

    try {
      await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: assistantMessageId }),
      });
    } catch (error) {
      console.error('Error sending cancellation signal to API:', error);
    }
  },
}));
