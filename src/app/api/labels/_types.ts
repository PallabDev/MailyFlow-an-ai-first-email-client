export interface ConnectedAccount {
  id: string;
  name: string;
  config: unknown;
}

export interface GmailConfig {
  access_token?: string;
  [key: string]: unknown;
}

export interface LabelData {
  messagesUnread?: number;
  messagesTotal?: number;
  [key: string]: unknown;
}
