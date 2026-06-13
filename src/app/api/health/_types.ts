export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  message?: string;
  error?: string;
}
