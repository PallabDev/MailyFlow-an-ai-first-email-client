import { create } from 'zustand';

export interface Attachment {
  name: string;
  type: string;
  base64: string;
  size: number;
}

interface ComposeState {
  isOpen: boolean;
  isMinimized: boolean;
  to: string;
  subject: string;
  body: string;
  attachments: Attachment[];
  openCompose: (initialData?: { to?: string; subject?: string; body?: string }) => void;
  closeCompose: () => void;
  minimizeCompose: () => void;
  restoreCompose: () => void;
  setTo: (to: string) => void;
  setSubject: (subject: string) => void;
  setBody: (body: string) => void;
  addAttachment: (attachment: Attachment) => void;
  removeAttachment: (index: number) => void;
  clearCompose: () => void;
}

export const useComposeStore = create<ComposeState>((set) => ({
  isOpen: false,
  isMinimized: false,
  to: '',
  subject: '',
  body: '',
  attachments: [],

  openCompose: (initialData) => set({
    isOpen: true,
    isMinimized: false,
    to: initialData?.to ?? '',
    subject: initialData?.subject ?? '',
    body: initialData?.body ?? '',
    attachments: [],
  }),

  closeCompose: () => set({
    isOpen: false,
    isMinimized: false,
    to: '',
    subject: '',
    body: '',
    attachments: [],
  }),

  minimizeCompose: () => set({ isMinimized: true }),
  restoreCompose: () => set({ isMinimized: false }),

  setTo: (to) => set({ to }),
  setSubject: (subject) => set({ subject }),
  setBody: (body) => set({ body }),

  addAttachment: (attachment) => set((state) => ({
    attachments: [...state.attachments, attachment]
  })),

  removeAttachment: (index) => set((state) => ({
    attachments: state.attachments.filter((_, i) => i !== index)
  })),

  clearCompose: () => set({
    to: '',
    subject: '',
    body: '',
    attachments: [],
  }),
}));
