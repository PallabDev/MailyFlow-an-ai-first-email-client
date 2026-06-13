export interface ConnectedAccount {
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

export interface GmailPartBody {
  data?: string;
  [key: string]: unknown;
}

export interface GmailPart {
  mimeType?: string;
  body?: GmailPartBody;
  parts?: GmailPart[];
  [key: string]: unknown;
}
