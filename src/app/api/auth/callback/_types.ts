export interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  [key: string]: unknown;
}

export interface GoogleWatchResponse {
  expiration?: string;
  historyId?: string;
  resourceId?: string;
  id?: string;
}
