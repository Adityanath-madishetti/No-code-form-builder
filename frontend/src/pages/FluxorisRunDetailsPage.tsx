import { useEffect, useState, type ComponentType } from 'react';
import { getCookie } from '@/lib/cookies';
import '@fluxoris/partner-mfe/style.css';

// shadcn/ui imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info, Loader2 } from 'lucide-react';

const FLUXORIS_PARTNER_TOKEN_KEY = 'fluxoris_partner_token';

type PartnerRunDetailsComponent = ComponentType<{
  runId?: string;
  workflowId?: string;
  autoRefreshMs?: number;
}>;

type FluxorisRun = {
  _id: string;
  workflow_id?: string;
  status?: string;
  started_at?: string;
  completed_at?: string | null;
  trigger_source?: string;
  workflow_name?: string;
};

export default function FluxorisRunDetailsPage() {
  const [ModuleComp, setModuleComp] =
    useState<PartnerRunDetailsComponent | null>(null);
  const [loadError, setLoadError] = useState('');

  const partnerApiBase =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    '';

  const [fluxorisApiBase, setFluxorisApiBase] = useState(
    import.meta.env.VITE_FLUXORIS_API_BASE_URL ||
      `${partnerApiBase.replace(/\/+$/, '')}/api/partner/fluxoris/proxy`
  );

  const [formId, setFormId] = useState('');
  const [workflowId, setWorkflowId] = useState('');
  const [runs, setRuns] = useState<FluxorisRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fluxorisToken = (
    getCookie(FLUXORIS_PARTNER_TOKEN_KEY) || ''
  ).trim();

  useEffect(() => {
    let mounted = true;
    import('@fluxoris/partner-mfe')
      .then((module) => {
        if (!mounted) return;
        setModuleComp(
          () =>
            (module as { PartnerRunDetailsPage?: PartnerRunDetailsComponent })
              .PartnerRunDetailsPage || null
        );
      })
      .catch((importError) => {
        if (!mounted) return;
        setLoadError(
          importError instanceof Error
            ? importError.message
            : 'Failed to load run details module.'
        );
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function resolveWorkflowAndRuns() {
    const token = fluxorisToken;
    if (!token) {
      setError('Get Fluxoris token first from the Dry Run page.');
      return;
    }
    const trimmedFormId = formId.trim();
    if (!trimmedFormId) {
      setError('Form ID is required.');
      return;
    }

    try {
      setRefreshing(true);
      setError('');

      const connectionRes = await fetch(
        `${fluxorisApiBase.replace(/\/+$/, '')}/partner/forms/${encodeURIComponent(
          trimmedFormId
        )}/active-connection`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!connectionRes.ok) {
        const msg = await connectionRes.text();
        throw new Error(msg || 'Could not resolve active form connection.');
      }
      const connection = (await connectionRes.json()) as {
        workflow_id?: string;
      };
      const resolvedWorkflowId = String(connection.workflow_id || '').trim();
      if (!resolvedWorkflowId) {
        throw new Error('No workflow_id found for active form connection.');
      }
      setWorkflowId(resolvedWorkflowId);

      const runsRes = await fetch(
        `${fluxorisApiBase.replace(/\/+$/, '')}/runs?workflow_id=${encodeURIComponent(
          resolvedWorkflowId
        )}&page=1&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!runsRes.ok) {
        const msg = await runsRes.text();
        throw new Error(msg || 'Could not load runs.');
      }

      const runsPayload = (await runsRes.json()) as { runs?: FluxorisRun[] };
      const rows = Array.isArray(runsPayload.runs) ? runsPayload.runs : [];
      setRuns(rows);
      if (rows.length > 0) {
        setSelectedRunId(rows[0]._id);
      } else {
        setSelectedRunId('');
      }
    } catch (err) {
      setRuns([]);
      setSelectedRunId('');
      setError(err instanceof Error ? err.message : 'Failed to load runs.');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Fluxoris Run Details
        </h1>
        <p className="mt-1 text-muted-foreground">
          Enter Form ID to auto-resolve workflow and list latest runs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-base">Fluxoris API Base URL</Label>
            <Input
              id="api-base"
              value={fluxorisApiBase}
              onChange={(event) => setFluxorisApiBase(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="form-id">Form ID</Label>
            <Input
              id="form-id"
              value={formId}
              onChange={(event) => setFormId(event.target.value)}
              placeholder="partner-form-id"
            />
          </div>

          <div className="pt-2">
            <Button onClick={resolveWorkflowAndRuns} disabled={refreshing}>
              {refreshing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {refreshing ? 'Loading Runs...' : 'Load Runs'}
            </Button>
          </div>

          {workflowId && (
            <Alert className="mt-4 border-primary/20 bg-primary/5">
              <Info className="h-4 w-4 text-primary" />
              <AlertTitle>Resolved</AlertTitle>
              <AlertDescription className="font-mono text-xs">
                Workflow ID: {workflowId}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Runs List */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Runs (Latest First)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {runs.length === 0 && (
              <p className="text-sm text-muted-foreground">No runs found.</p>
            )}
            <div className="space-y-3">
              {runs.map((run) => {
                const selected = run._id === selectedRunId;
                return (
                  <button
                    key={run._id}
                    type="button"
                    onClick={() => setSelectedRunId(run._id)}
                    className={`w-full rounded-md border p-3 text-left text-sm transition-colors ${
                      selected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="mb-1 font-medium text-foreground">
                      {run._id}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Status:{' '}
                      <span className="font-medium text-foreground">
                        {run.status || '-'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Started:{' '}
                      {run.started_at
                        ? new Date(run.started_at).toLocaleString()
                        : '-'}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Module Viewer */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            {loadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Module Load Error</AlertTitle>
                <AlertDescription>
                  Could not load run details module: {loadError}
                </AlertDescription>
              </Alert>
            )}

            {!loadError && !ModuleComp && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Loading</AlertTitle>
                <AlertDescription>
                  Loading run details module...
                </AlertDescription>
              </Alert>
            )}

            {ModuleComp && selectedRunId ? (
              <div className="rounded-md border bg-background p-4">
                <ModuleComp
                  runId={selectedRunId}
                  workflowId={workflowId || undefined}
                  autoRefreshMs={0}
                />
              </div>
            ) : ModuleComp && !selectedRunId ? (
              <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                Select a run from the list to view details
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
