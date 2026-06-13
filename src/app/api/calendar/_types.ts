export interface ConnectedAccount {
  name: string;
  config: unknown;
}

export interface CalendarConfig {
  access_token?: string;
  [key: string]: unknown;
}

export interface GoogleCalendarDateTime {
  dateTime?: string;
  timeZone?: string;
}

export interface GoogleCalendarEventInput {
  summary?: string;
  description?: string;
  start?: GoogleCalendarDateTime;
  end?: GoogleCalendarDateTime;
  [key: string]: unknown;
}

export interface CreateEventRequest {
  event: GoogleCalendarEventInput;
}

export interface UpdateEventRequest {
  id: string;
  event: GoogleCalendarEventInput;
}

export interface DeleteEventRequest {
  id?: string;
}
