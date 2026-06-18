export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{
    name: string;
    type: string;
    base64: string;
  }>;
}

export interface ConnectedAccountBasic {
  name: string;
}
