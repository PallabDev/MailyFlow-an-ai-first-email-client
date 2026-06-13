export interface TrashEmailRequest {
  id: string;
  permanently?: boolean;
}

export interface ConnectedAccount {
  id: string;
  name: string;
  config: unknown;
}

export interface GmailConfig {
  access_token?: string;
  refresh_token?: string;
  [key: string]: unknown;
}
