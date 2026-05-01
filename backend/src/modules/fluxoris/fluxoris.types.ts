export interface FluxorisConfig {
  baseUrl: string;
  clientId: string;
  audience: string;
  sharedSecret: string;
}

export interface FluxorisEventPayload {
  event_type?: string;
  status?: string;
  event?: string;
  run_id?: string;
  runId?: string;
  workflow_id?: string;
  workflowId?: string;
  form_id?: string;
  formId?: string;
  [key: string]: any;
}

export interface FluxorisExchangeResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  [key: string]: any;
}
