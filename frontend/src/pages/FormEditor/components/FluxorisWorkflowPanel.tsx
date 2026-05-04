import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFormStore } from '@/form/store/form.store';
import { api } from '@/lib/api';
import { getCookie, setCookie } from '@/lib/cookies';
import {
  Loader2,
  GitBranch,
  Settings2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  History,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import '@fluxoris/partner-mfe/style.css';

// shadcn/ui imports
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- MFE Integration Types & Utils ---
type RemoteModule = typeof import('fluxorisPartnerMfe/PartnerIntegration');
type PackageModule = typeof import('@fluxoris/partner-mfe');
type IntegrationModule = RemoteModule | PackageModule;
type IntegrationModuleLike = IntegrationModule & {
  default?: IntegrationModule;
};

function getRemoteExport<T>(
  moduleRef: IntegrationModule | null,
  key: string
): T | undefined {
  if (!moduleRef) return undefined;
  const direct = (moduleRef as Record<string, unknown>)[key];
  if (direct !== undefined) return direct as T;
  const fallback = (moduleRef as IntegrationModuleLike).default?.[
    key as keyof IntegrationModule
  ];
  return fallback as T | undefined;
}

const FLUXORIS_PARTNER_TOKEN_KEY = 'fluxoris_partner_token';

function inferSchemaForComponent(
  componentType: string
): Record<string, unknown> {
  const key = String(componentType || '').toLowerCase();
  if (
    key === 'number' ||
    key === 'decimal' ||
    key === 'rating' ||
    key === 'linear-scale' ||
    key === 'slider'
  ) {
    return { type: 'number' };
  }
  if (key === 'checkbox') {
    return { type: 'array', items: { type: 'string' } };
  }
  if (key === 'multi-choice-grid' || key === 'matrix-table') {
    return { type: 'object', additionalProperties: true };
  }
  if (
    key === 'single-choice-grid' ||
    key === 'radio' ||
    key === 'dropdown' ||
    key === 'color-picker' ||
    key === 'signature'
  ) {
    return { type: 'string' };
  }
  if (key === 'email') {
    return { type: 'string', format: 'email' };
  }
  if (key === 'url') {
    return { type: 'string', format: 'uri' };
  }
  if (key === 'phone') {
    return { type: 'string' };
  }
  if (key === 'file-upload' || key === 'image-upload') {
    return { type: 'array', items: { type: 'string' } };
  }
  if (key === 'date' || key === 'time') {
    return { type: 'string' };
  }
  if (key === 'address-block' || key === 'name-block') {
    return { type: 'object', additionalProperties: true };
  }
  return { type: 'string' };
}

function slugifyFieldKey(value: string, fallback: string): string {
  const slug = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || fallback;
}

/**
 * Derives schema from the form store state.
 * This is similar to the DryRunPage but uses the store's current state.
 */
function deriveSchemaFromStore(components: Record<string, any>) {
  const properties: Record<string, unknown> = {};
  const fieldMap: Record<string, string> = {};
  const nonDataComponentTypes = new Set([
    'heading',
    'section-divider',
    'page-break',
  ]);
  const usedKeys = new Set<string>();
  let fallbackCounter = 1;

  Object.values(components).forEach((comp) => {
    const sourceId = comp.instanceId;
    const componentType = String(comp.type || '')
      .trim()
      .toLowerCase();

    if (!sourceId || nonDataComponentTypes.has(componentType)) return;

    const label = String(comp.metadata?.label || '').trim();
    const question = String(comp.metadata?.question || '').trim();
    const baseName = slugifyFieldKey(
      label || question || sourceId,
      `field_${fallbackCounter++}`
    );

    let readableKey = baseName;
    let suffix = 2;
    while (usedKeys.has(readableKey)) {
      readableKey = `${baseName}_${suffix++}`;
    }
    usedKeys.add(readableKey);

    properties[readableKey] = inferSchemaForComponent(componentType);
    fieldMap[sourceId] = readableKey;
  });

  return {
    schema: {
      type: 'object',
      properties,
      required: Object.keys(properties),
      additionalProperties: false,
    },
    fieldMap,
  };
}

export function FluxorisWorkflowPanel() {
  const form = useFormStore((s) => s.form);
  const components = useFormStore((s) => s.components);

  const [remote, setRemote] = useState<IntegrationModule | null>(null);
  const [loadError, setLoadError] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [fluxorisToken, setFluxorisToken] = useState('');
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [exchangeError, setExchangeError] = useState('');

  const [showConfig, setShowConfig] = useState(false);
  const [connectedWorkflow, setConnectedWorkflow] = useState<any>(null);

  // Run History State
  const [runs, setRuns] = useState<any[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Environment Config
  const partnerApiBase =
    import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
  const [statusWebhookUrl, setStatusWebhookUrl] = useState(
    `${partnerApiBase.replace(/\/+$/, '')}/api/partner/fluxoris/events`
  );
  const [fluxorisApiBase, setFluxorisApiBase] = useState(() => {
    const envVal = import.meta.env.VITE_FLUXORIS_API_BASE_URL as
      | string
      | undefined;
    if (!envVal) return `${window.location.origin}/api/partner/fluxoris/proxy`;
    if (envVal.startsWith('/')) return `${window.location.origin}${envVal}`;
    return envVal;
  });

  // 1. Load MFE Module
  useEffect(() => {
    let mounted = true;
    import('@fluxoris/partner-mfe')
      .then((module) => {
        if (mounted) setRemote(module);
      })
      .catch(() => {
        import('fluxorisPartnerMfe/PartnerIntegration')
          .then((module) => {
            if (mounted) setRemote(module);
          })
          .catch((error) => {
            if (mounted)
              setLoadError(
                error instanceof Error ? error.message : 'Failed to load MFE'
              );
          });
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Load Token from Cookies
  useEffect(() => {
    const stored = getCookie(FLUXORIS_PARTNER_TOKEN_KEY) || '';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored.trim()) setFluxorisToken(stored.trim());
  }, []);

  // 3. Configure API Client
  useEffect(() => {
    if (!remote) return;
    const remoteApi = getRemoteExport<{
      configureApiClient?: (options?: {
        baseUrl?: string;
        getToken?: () => string | null;
      }) => void;
    }>(remote, 'partnerIntegrationApi');

    if (remoteApi?.configureApiClient) {
      remoteApi.configureApiClient({
        baseUrl: fluxorisApiBase,
        getToken: () => fluxorisToken || null,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsConfigured(true);
    }
  }, [remote, fluxorisApiBase, fluxorisToken]);

  // 4. Fetch existing connection
  useEffect(() => {
    if (!isConfigured || !fluxorisToken || !form?.id || !remote) return;

    const fetchConn = getRemoteExport<(formId: string) => Promise<any>>(
      remote,
      'fetchPartnerFormConnection'
    );

    if (fetchConn) {
      fetchConn(form.id)
        .then((result) => {
          if (result && result.workflow_id) {
            setConnectedWorkflow(result);
          }
        })
        .catch((_err) => {
          // It's fine if no connection exists, don't show error
        });
    }
  }, [isConfigured, fluxorisToken, form?.id, remote]);

  const fetchRuns = useCallback(
    async (workflowId: string) => {
      if (!fluxorisToken || !workflowId) return;
      try {
        setLoadingRuns(true);
        const url = `${fluxorisApiBase.replace(/\/+$/, '')}/runs?workflow_id=${encodeURIComponent(workflowId)}&limit=10`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${fluxorisToken}` },
        });
        if (!res.ok) throw new Error('Failed to fetch runs');
        const data = await res.json();
        setRuns(data.runs || []);
      } catch (err) {
        console.error('Fetch runs error:', err);
      } finally {
        setLoadingRuns(false);
      }
    },
    [fluxorisApiBase, fluxorisToken]
  );

  useEffect(() => {
    if (connectedWorkflow?.workflow_id) {
      fetchRuns(connectedWorkflow.workflow_id);
    } else {
      setRuns([]);
    }
  }, [connectedWorkflow?.workflow_id, fetchRuns]);

  // Derive Schema
  const { schema, fieldMap } = useMemo(
    () => deriveSchemaFromStore(components),
    [components]
  );

  const TemplateBuilderFlow = getRemoteExport<
    RemoteModule['TemplateBuilderFlow']
  >(remote, 'TemplateBuilderFlow');

  const RunStatusTimeline = getRemoteExport<any>(remote, 'RunStatusTimeline');

  const handleExchangeToken = async () => {
    try {
      setExchangeError('');
      setExchangeLoading(true);
      const result = await api.post<{ access_token?: string; token?: string }>(
        '/api/partner/fluxoris/exchange-token'
      );
      const token = result.access_token || result.token || '';
      if (!token) throw new Error('No token returned');
      setFluxorisToken(token);
      setCookie(FLUXORIS_PARTNER_TOKEN_KEY, token);
      toast.success('Fluxoris session authenticated');
    } catch (error) {
      setExchangeError(
        error instanceof Error ? error.message : 'Token exchange failed'
      );
      toast.error('Failed to authenticate with Fluxoris');
    } finally {
      setExchangeLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!remote || !form?.id) return;
    const disconnectFn = getRemoteExport<(formId: string) => Promise<any>>(
      remote,
      'disconnectPartnerFormConnection'
    );

    if (disconnectFn) {
      try {
        await disconnectFn(form.id);
        setConnectedWorkflow(null);
        toast.success('Workflow disconnected');
      } catch (error) {
        toast.error('Failed to disconnect workflow');
        console.error('Disconnect error:', error);
      }
    } else {
      // Fallback if MFE doesn't have the function yet
      setConnectedWorkflow(null);
    }
  };

  if (!form) return null;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-widest uppercase">
            <GitBranch className="h-4 w-4 text-primary" />
            Fluxoris Workflows
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings2
              className={`h-4 w-4 transition-colors ${showConfig ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </Button>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Automate actions when this form is submitted.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Configuration Section (Toggled) */}
        {showConfig && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="space-y-3 pt-4">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase">
                  API Proxy URL
                </Label>
                <Input
                  value={fluxorisApiBase}
                  onChange={(e) => setFluxorisApiBase(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase">
                  Webhook URL
                </Label>
                <Input
                  value={statusWebhookUrl}
                  onChange={(e) => setStatusWebhookUrl(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-full text-xs"
                onClick={handleExchangeToken}
                disabled={exchangeLoading}
              >
                {exchangeLoading ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-3 w-3" />
                )}
                Refresh Authentication
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading / Error States */}
        {loadError && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-xs">MFE Load Error</AlertTitle>
            <AlertDescription className="text-[10px]">
              {loadError}
            </AlertDescription>
          </Alert>
        )}

        {!remote && !loadError && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-primary" />
            <span className="text-xs">Loading Fluxoris Integration...</span>
          </div>
        )}

        {/* Connection Status */}
        {remote && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 p-6 text-center">
              {!fluxorisToken ? (
                <>
                  <AlertCircle className="mb-3 h-10 w-10 text-amber-500 opacity-50" />
                  <h3 className="text-sm font-medium">
                    Authentication Required
                  </h3>
                  <p className="mt-1 mb-4 text-[10px] text-muted-foreground">
                    Connect your account to start building workflows.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleExchangeToken}
                    disabled={exchangeLoading}
                  >
                    {exchangeLoading && (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    )}
                    Connect Fluxoris
                  </Button>
                </>
              ) : !connectedWorkflow ? (
                <>
                  <div className="relative mb-3">
                    <GitBranch className="h-10 w-10 text-primary opacity-30" />
                    <div className="absolute -top-1 -right-1">
                      <Badge
                        variant="secondary"
                        className="flex h-4 w-4 items-center justify-center rounded-full p-0"
                      >
                        !
                      </Badge>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium">No Workflow Connected</h3>
                  <p className="mt-1 mb-4 text-[10px] text-muted-foreground">
                    Map form fields to automated steps and integrations.
                  </p>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <ExternalLink className="h-3 w-3" />
                        Open Workflow Builder
                      </Button>
                    </DialogTrigger>
                    {/* FIX: Changed width classes to override shadcn's max-w-lg */}
                    <DialogContent className="flex h-[90vh] w-[95vw] flex-col overflow-hidden p-0 sm:max-w-[1400px]">
                      <DialogHeader className="shrink-0 border-b bg-muted/30 p-4">
                        <DialogTitle className="flex items-center gap-2">
                          <GitBranch className="h-5 w-5 text-primary" />
                          Fluxoris Workflow Builder —{' '}
                          {form.name || 'Untitled Form'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="relative flex-1 overflow-auto bg-background">
                        {TemplateBuilderFlow && isConfigured ? (
                          // eslint-disable-next-line react-hooks/static-components
                          <TemplateBuilderFlow
                            formId={form.id}
                            schemaJson={schema}
                            fieldMap={fieldMap}
                            statusWebhookUrl={statusWebhookUrl}
                            onConnected={(result: any) => {
                              setConnectedWorkflow(result);
                              toast.success('Workflow successfully connected!');
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <>
                  <CheckCircle2 className="mb-3 h-10 w-10 text-green-500" />
                  <h3 className="text-sm font-medium text-green-600">
                    Workflow Connected
                  </h3>
                  <div className="mt-3 w-full space-y-1 rounded border bg-background p-2 text-left font-mono text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="ml-2 truncate text-primary">
                        {connectedWorkflow.workflow_id}
                      </span>
                    </div>
                    {connectedWorkflow.webhook?.path && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Path:</span>
                        <span className="ml-2 truncate text-primary">
                          {connectedWorkflow.webhook.path}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex w-full gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                        >
                          Edit Workflow
                        </Button>
                      </DialogTrigger>
                      {/* FIX: Applied the same width and flex layout fixes here */}
                      <DialogContent className="flex h-[90vh] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1400px]">
                        <DialogHeader className="shrink-0 border-b bg-muted/30 p-4">
                          <DialogTitle className="flex items-center gap-2">
                            <GitBranch className="h-5 w-5 text-primary" />
                            Edit Workflow — {form.name || 'Untitled Form'}
                          </DialogTitle>
                        </DialogHeader>
                        {/* FIX: Adjusted wrapper for proper inner scrolling */}
                        <div className="relative flex-1 overflow-auto bg-background">
                          {TemplateBuilderFlow && isConfigured && (
                            // eslint-disable-next-line react-hooks/static-components
                            <TemplateBuilderFlow
                              formId={form.id}
                              schemaJson={schema}
                              fieldMap={fieldMap}
                              statusWebhookUrl={statusWebhookUrl}
                              onConnected={(result: any) => {
                                setConnectedWorkflow(result);
                                toast.success('Workflow updated!');
                              }}
                            />
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </Button> */}
                  </div>
                </>
              )}
            </div>

            {/* Field Mapping Summary */}
            <div className="space-y-2">
              <h4 className="px-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Field Mapping ({Object.keys(fieldMap).length} fields)
              </h4>
              <div className="divide-y overflow-hidden rounded-lg border bg-muted/50">
                {Object.entries(fieldMap)
                  .slice(0, 5)
                  .map(([id, slug]) => (
                    <div
                      key={id}
                      className="flex justify-between p-2 text-[10px]"
                    >
                      <span className="max-w-[120px] truncate text-muted-foreground">
                        {components[id]?.metadata?.label || id}
                      </span>
                      <span className="rounded bg-primary/5 px-1 font-mono text-primary">
                        {slug}
                      </span>
                    </div>
                  ))}
                {Object.keys(fieldMap).length > 5 && (
                  <div className="p-2 text-center text-[10px] text-muted-foreground italic">
                    + {Object.keys(fieldMap).length - 5} more fields
                  </div>
                )}
              </div>
            </div>

            {/* Workflow Run History (New Section) */}
            {connectedWorkflow && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="flex items-center gap-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    <History className="h-3 w-3" />
                    Recent Activity
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => fetchRuns(connectedWorkflow.workflow_id)}
                    disabled={loadingRuns}
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${loadingRuns ? 'animate-spin' : ''}`}
                    />
                  </Button>
                </div>

                {loadingRuns && runs.length === 0 ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : runs.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <p className="text-[10px] text-muted-foreground">
                      No runs detected yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {runs.map((run) => (
                      <Dialog key={run._id}>
                        <DialogTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg border bg-background p-2 text-left transition-colors hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  run.status === 'completed'
                                    ? 'bg-green-500'
                                    : run.status === 'failed'
                                      ? 'bg-red-500'
                                      : 'animate-pulse bg-amber-500'
                                }`}
                              />
                              <div>
                                <div className="text-[10px] leading-none font-medium">
                                  {new Date(run.started_at).toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                                <div className="mt-1 font-mono text-[9px] text-muted-foreground">
                                  {run._id.slice(-8)}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="flex h-[80vh] w-[90vw] flex-col overflow-hidden p-0 sm:max-w-[800px]">
                          <DialogHeader className="shrink-0 border-b bg-muted/30 p-4">
                            <DialogTitle className="flex items-center gap-2">
                              <Activity className="h-5 w-5 text-primary" />
                              Run Details — {run._id}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="relative flex-1 overflow-auto bg-background p-6">
                            {RunStatusTimeline ? (
                              <RunStatusTimeline
                                runId={run._id}
                                workflowId={connectedWorkflow.workflow_id}
                                autoRefreshMs={
                                  run.status === 'completed' ||
                                  run.status === 'failed'
                                    ? 0
                                    : 3000
                                }
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t bg-muted/20 p-3 text-center">
        <p className="text-[9px] text-muted-foreground">
          Powered by Fluxoris MFE Architecture
        </p>
      </div>
    </div>
  );
}
