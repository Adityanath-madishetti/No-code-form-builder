declare module 'fluxorisPartnerMfe/PartnerIntegration' {
  import type { ComponentType } from 'react';

  export const TemplatePicker: ComponentType<{
    value?: string;
    onChange?: (value: string) => void;
  }>;

  export const SchemaPublishPanel: ComponentType<{
    formId?: string;
    schemaJson?: Record<string, unknown>;
    schemaText?: string;
    fieldMap?: Record<string, string>;
    onPublished?: (result: { schema_version: number }) => void;
  }>;

  export const TemplateWorkflowBuilder: ComponentType<{
    templateId?: string;
    schemaJson?: Record<string, unknown>;
    value?: {
      nodes?: Array<Record<string, unknown>>;
      edges?: Array<Array<number | null>>;
      rules?: Array<Record<string, unknown>>;
    };
    onChange?: (draft: Record<string, unknown>) => void;
  }>;

  export const TemplateBuilderFlow: ComponentType<{
    formId?: string;
    schemaJson?: Record<string, unknown>;
    fieldMap?: Record<string, string>;
    statusWebhookUrl?: string;
    onConnected?: (result: {
      workflow_id?: string;
      webhook?: { path?: string };
      connection_status?: string;
    }) => void;
    onDraftChange?: (draft: Record<string, unknown>) => void;
  }>;

  export const FlowConnector: ComponentType<{
    formId?: string;
    templateId?: string;
    schemaVersion?: number;
    statusWebhookUrl?: string;
    onConnected?: (result: {
      workflow_id?: string;
      webhook_path?: string;
      connection_status?: string;
    }) => void;
  }>;

  export const RunStatusTimeline: ComponentType<{
    currentStatus?: string;
    steps?: string[];
  }>;

  export const partnerIntegrationApi: {
    configureApiClient: (options?: {
      baseUrl?: string;
      getToken?: () => string | null;
      onUnauthorized?: () => void;
    }) => void;
    resetApiClientConfig: () => void;
    getApiBaseUrl: () => string;
  };
}

declare module '@fluxoris/partner-mfe' {
  import type { ComponentType } from 'react';

  export const TemplatePicker: ComponentType<{
    value?: string;
    onChange?: (value: string) => void;
  }>;

  export const SchemaPublishPanel: ComponentType<{
    formId?: string;
    schemaJson?: Record<string, unknown>;
    schemaText?: string;
    fieldMap?: Record<string, string>;
    onPublished?: (result: { schema_version: number }) => void;
  }>;

  export const TemplateWorkflowBuilder: ComponentType<{
    templateId?: string;
    schemaJson?: Record<string, unknown>;
    value?: {
      nodes?: Array<Record<string, unknown>>;
      edges?: Array<Array<number | null>>;
      rules?: Array<Record<string, unknown>>;
    };
    onChange?: (draft: Record<string, unknown>) => void;
  }>;

  export const TemplateBuilderFlow: ComponentType<{
    formId?: string;
    schemaJson?: Record<string, unknown>;
    fieldMap?: Record<string, string>;
    statusWebhookUrl?: string;
    onConnected?: (result: {
      workflow_id?: string;
      webhook?: { path?: string };
      connection_status?: string;
    }) => void;
    onDraftChange?: (draft: Record<string, unknown>) => void;
  }>;

  export const FlowConnector: ComponentType<{
    formId?: string;
    templateId?: string;
    schemaVersion?: number;
    statusWebhookUrl?: string;
    onConnected?: (result: {
      workflow_id?: string;
      webhook_path?: string;
      connection_status?: string;
    }) => void;
  }>;

  export const RunStatusTimeline: ComponentType<{
    currentStatus?: string;
    steps?: string[];
  }>;

  export const partnerIntegrationApi: {
    configureApiClient: (options?: {
      baseUrl?: string;
      getToken?: () => string | null;
      onUnauthorized?: () => void;
    }) => void;
    resetApiClientConfig: () => void;
    getApiBaseUrl: () => string;
  };
}

declare module '@fluxoris/partner-mfe/style.css';
