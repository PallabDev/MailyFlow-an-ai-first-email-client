export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
}

export interface ConnectedAccountBasic {
  name: string;
}
