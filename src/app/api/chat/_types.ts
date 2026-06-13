export interface ChatUserDetails {
  hasGmailConnection?: boolean;
  hasCalendarConnection?: boolean;
  [key: string]: unknown;
}

export interface ChatMessageItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequestBody {
  messages: ChatMessageItem[];
  timezone?: string;
  localTime?: string;
  userDetails?: ChatUserDetails;
}
