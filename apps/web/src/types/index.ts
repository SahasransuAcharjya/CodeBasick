export interface HealthResponse {
  status: string;
  app: string;
  version: string;
}

export interface WorkspaceConfig {
  name: string;
  version: string;
  environment: "development" | "production" | "test";
}
