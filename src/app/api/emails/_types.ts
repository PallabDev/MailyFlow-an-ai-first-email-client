export interface ConnectedAccount {
  id: string;
  name: string;
  config: unknown;
}

export interface GmailConfig {
  access_token?: string;
  [key: string]: unknown;
}

export interface GmailHeader {
  name?: string;
  value?: string;
}

export interface GmailMessagePayload {
  headers?: GmailHeader[];
  [key: string]: unknown;
}

export interface GmailMessageDetails {
  id?: string;
  subject?: string;
  from?: string;
  date?: string;
  internalDate?: string;
  snippet?: string;
  body?: string;
  labelIds?: string[];
  payload?: GmailMessagePayload;
  [key: string]: unknown;
}

export interface EmailItem {
  id: string;
  from: string;
  date: string;
  subject: string;
  snippet: string;
  body: string;
  labelIds: string[];
  internalDate?: string;
}

export interface GmailMessageSummary {
  id?: string;
  threadId?: string;
  [key: string]: unknown;
}

export interface CorsairEntityRow {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  accountId: string;
  entityId: string;
  entityType: string;
  version: string;
  data: unknown; // Can be cast to GmailMessageDetails
}
