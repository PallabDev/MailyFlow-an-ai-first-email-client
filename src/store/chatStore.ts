import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  clientKey?: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
}

interface ChatState {
  messages: ChatMessage[];
  historyMessages: ChatMessage[]; // Store all historical messages fetched from DB
  chatLoading: boolean;
  chatInput: string;
  isPaused: boolean;
  sidebarWidth: number;
  pollingIntervalId: NodeJS.Timeout | null;
  theme: 'light' | 'dark';
  isRightSidebarCollapsed: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setIsRightSidebarCollapsed: (collapsed: boolean) => void;
  fetchMessages: (userId: string) => Promise<void>;
  fetchHistory: (userId: string) => Promise<void>;
  setMessages: (messages: ChatMessage[]) => void;
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
  historyMessages: [],
  chatLoading: false,
  chatInput: '',
  isPaused: false,
  sidebarWidth: 360,
  theme: 'light',
  isRightSidebarCollapsed: false,
  pollingIntervalId: null,

  setIsRightSidebarCollapsed: (collapsed) => set({ isRightSidebarCollapsed: collapsed }),

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ theme });
  },

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

  fetchHistory: async (userId) => {
    try {
      const res = await fetch(`/api/chat?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        set({ historyMessages: data.messages || [] });
      }
    } catch (error) {
      console.error('Error fetching full chat history:', error);
    }
  },

  setMessages: (msgs) => set({ messages: msgs }),

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
        clientKey: tempUserMsgId,
        role: 'user',
        content: text,
        status: 'completed',
        createdAt: new Date().toISOString(),
      },
      {
        id: tempAssistantMsgId,
        clientKey: tempAssistantMsgId,
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
          messages: get().messages
            .slice(0, -1)
            .filter((m) => m.content && m.content.trim() !== '')
            .map((m) => ({ role: m.role, content: m.content })),
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
          if (m.id === tempUserMsgId) return { ...m, id: actualUserMsgId, clientKey: tempUserMsgId };
          if (m.id === tempAssistantMsgId) return { ...m, id: actualAssistantMsgId, clientKey: tempAssistantMsgId };
          return m;
        }),
      }));

      // Start polling for the assistant's reply
      let elapsedSeconds = 0;
      const intervalId = setInterval(async () => {
        elapsedSeconds += 1;
        if (elapsedSeconds > 300) {
          get().clearPolling();
          set((state) => ({
            chatLoading: false,
            messages: state.messages.map((m) =>
              m.id === actualAssistantMsgId
                ? {
                    ...m,
                    status: 'failed',
                    content: '⚠️ Failed to do that, please try again later.',
                  }
                : m
            ),
          }));
          return;
        }
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
                  m.id === actualAssistantMsgId ? { ...targetMsg, clientKey: m.clientKey } : m
                ),
              }));

              if (targetMsg.status !== 'pending') {
                get().clearPolling();
                set({ chatLoading: false });
                // Refresh full history list in background to include this new interaction session
                get().fetchHistory(userId).catch(() => {});
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
