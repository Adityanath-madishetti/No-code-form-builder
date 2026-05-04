import { useEffect, useState, type ComponentType } from 'react';
import '@fluxoris/partner-mfe/style.css';

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
    'http://localhost:5001';
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
    localStorage.getItem(FLUXORIS_PARTNER_TOKEN_KEY) || ''
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
    <div className="mx-auto w-full max-w-6xl space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Fluxoris Run Details</h1>
        <p className="text-sm text-muted-foreground">
          Enter Form ID to auto-resolve workflow and list latest runs.
        </p>
      </div>

      <div className="rounded-md border p-4">
        <label className="mb-2 block text-sm font-medium">
          Fluxoris API Base URL
        </label>
        <input
          className="mb-3 w-full rounded border px-3 py-2 text-sm"
          value={fluxorisApiBase}
          onChange={(event) => setFluxorisApiBase(event.target.value)}
        />
        <label className="mb-2 block text-sm font-medium">Form ID</label>
        <input
          className="mb-3 w-full rounded border px-3 py-2 text-sm"
          value={formId}
          onChange={(event) => setFormId(event.target.value)}
          placeholder="partner-form-id"
        />
        <button
          type="button"
          className="rounded border px-3 py-1 text-xs"
          onClick={resolveWorkflowAndRuns}
          disabled={refreshing}
        >
          {refreshing ? 'Loading...' : 'Load Runs'}
        </button>
        {workflowId && (
          <p className="mt-2 text-sm">
            Resolved Workflow ID: <code>{workflowId}</code>
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-md border p-4">
          <h2 className="mb-3 text-base font-semibold">Runs (Latest First)</h2>
          {runs.length === 0 && (
            <p className="text-sm text-muted-foreground">No runs found.</p>
          )}
          <div className="space-y-2">
            {runs.map((run) => {
              const selected = run._id === selectedRunId;
              return (
                <button
                  key={run._id}
                  type="button"
                  onClick={() => setSelectedRunId(run._id)}
                  className={`w-full rounded border p-2 text-left text-xs ${
                    selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div>
                    <strong>{run._id}</strong>
                  </div>
                  <div>Status: {run.status || '-'}</div>
                  <div>
                    Started:{' '}
                    {run.started_at
                      ? new Date(run.started_at).toLocaleString()
                      : '-'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border p-4 lg:col-span-2">
          {loadError && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              Could not load run details module: {loadError}
            </div>
          )}

          {!loadError && !ModuleComp && (
            <div className="rounded-md border p-3 text-sm">
              Loading run details module...
            </div>
          )}

          {ModuleComp && selectedRunId && (
            <ModuleComp
              runId={selectedRunId}
              workflowId={workflowId || undefined}
              autoRefreshMs={0}
            />
          )}
        </div>
      </div>
    </div>
  );
}
