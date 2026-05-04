import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Link, useSearchParams } from 'react-router-dom';
import '@fluxoris/partner-mfe/style.css';

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

const DEFAULT_SCHEMA = JSON.stringify(
  {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
  },
  null,
  2
);

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function deriveSchemaFromFormVersion(
  versionPayload: Record<string, unknown> | null
): Record<string, unknown> | null {
  const version = (versionPayload?.version ?? versionPayload) as
    | Record<string, unknown>
    | undefined;
  if (!version || typeof version !== 'object') return null;
  const pages = Array.isArray(version.pages) ? version.pages : [];

  const properties: Record<string, unknown> = {};
  const nonDataComponentTypes = new Set([
    'heading',
    'section-divider',
    'page-break',
  ]);

  for (const page of pages) {
    const pageObj = page as Record<string, unknown>;
    const components = Array.isArray(pageObj.components)
      ? pageObj.components
      : [];
    for (const comp of components) {
      const compObj = comp as Record<string, unknown>;
      const componentId = String(compObj.componentId || '').trim();
      const componentType = String(compObj.componentType || '')
        .trim()
        .toLowerCase();
      if (!componentId || nonDataComponentTypes.has(componentType)) continue;
      properties[componentId] = inferSchemaForComponent(componentType);
    }
  }

  const required = Object.keys(properties);

  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  };
}

function slugifyFieldKey(value: string, fallback: string): string {
  const slug = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || fallback;
}

function deriveReadableSchemaAndFieldMap(
  versionPayload: Record<string, unknown> | null
): {
  schema: Record<string, unknown> | null;
  fieldMap: Record<string, string>;
} {
  const version = (versionPayload?.version ?? versionPayload) as
    | Record<string, unknown>
    | undefined;
  if (!version || typeof version !== 'object')
    return { schema: null, fieldMap: {} };
  const pages = Array.isArray(version.pages) ? version.pages : [];

  const properties: Record<string, unknown> = {};
  const fieldMap: Record<string, string> = {};
  const nonDataComponentTypes = new Set([
    'heading',
    'section-divider',
    'page-break',
  ]);
  const usedKeys = new Set<string>();
  let fallbackCounter = 1;

  for (const page of pages) {
    const pageObj = page as Record<string, unknown>;
    const components = Array.isArray(pageObj.components)
      ? pageObj.components
      : [];
    for (const comp of components) {
      const compObj = comp as Record<string, unknown>;
      const sourceId = String(compObj.componentId || '').trim();
      const componentType = String(compObj.componentType || '')
        .trim()
        .toLowerCase();
      if (!sourceId || nonDataComponentTypes.has(componentType)) continue;

      const label = String(compObj.label || '').trim();
      const question = String(compObj.question || '').trim();
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
    }
  }

  const required = Object.keys(properties);
  return {
    schema: {
      type: 'object',
      properties,
      required,
      additionalProperties: false,
    },
    fieldMap,
  };
}

export default function FluxorisMfeDryRunPage() {
  const [searchParams] = useSearchParams();
  const [remote, setRemote] = useState<IntegrationModule | null>(null);
  const [loadError, setLoadError] = useState('');
  const [formId, setFormId] = useState(searchParams.get('formId') || '');
  const [schemaText, setSchemaText] = useState(DEFAULT_SCHEMA);
  const partnerApiBase =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:5001';
  const [statusWebhookUrl, setStatusWebhookUrl] = useState(
    `${partnerApiBase.replace(/\/+$/, '')}/api/partner/fluxoris/events`
  );
  const [fluxorisApiBase, setFluxorisApiBase] = useState(() => {
    const envVal = import.meta.env.VITE_FLUXORIS_API_BASE_URL as string | undefined;
    if (!envVal) return `${window.location.origin}/api/partner/fluxoris/proxy`;
    // If it's a relative path (starts with /), resolve against current origin
    if (envVal.startsWith('/')) return `${window.location.origin}${envVal}`;
    return envVal;
  });
  const [fluxorisAppBase, setFluxorisAppBase] = useState(
    import.meta.env.VITE_FLUXORIS_APP_BASE_URL || 'http://localhost:5173'
  );
  const [fluxorisToken, setFluxorisToken] = useState('');
  const [connectedMessage, setConnectedMessage] = useState('');
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [exchangeError, setExchangeError] = useState('');
  const [remoteApiError, setRemoteApiError] = useState('');
  const [schemaLoadError, setSchemaLoadError] = useState('');
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    import('@fluxoris/partner-mfe')
      .then((module) => {
        if (!mounted) return;
        setRemote(module);
      })
      .catch(() => {
        import('fluxorisPartnerMfe/PartnerIntegration')
          .then((module) => {
            if (!mounted) return;
            setRemote(module);
          })
          .catch((error: unknown) => {
            if (!mounted) return;
            const message =
              error instanceof Error
                ? error.message
                : 'Failed to load integration module.';
            setLoadError(message);
          });
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadSchemaFromForm() {
      const trimmed = formId.trim();
      if (!trimmed) return;
      try {
        setSchemaLoadError('');
        const payload = await api.get<Record<string, unknown>>(
          `/api/forms/${encodeURIComponent(trimmed)}/versions/latest`
        );
        if (cancelled) return;
        const { schema, fieldMap: derivedFieldMap } =
          deriveReadableSchemaAndFieldMap(payload);
        if (schema) {
          setSchemaText(JSON.stringify(schema, null, 2));
          setFieldMap(derivedFieldMap);
        }
      } catch (error) {
        if (cancelled) return;
        setSchemaLoadError(
          error instanceof Error
            ? error.message
            : 'Could not auto-load schema from form version.'
        );
      }
    }
    loadSchemaFromForm();
    return () => {
      cancelled = true;
    };
  }, [formId]);

  useEffect(() => {
    const stored = localStorage.getItem(FLUXORIS_PARTNER_TOKEN_KEY) || '';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored.trim()) setFluxorisToken(stored.trim());
  }, []);

  useEffect(() => {
    if (!remote) return;
    const remoteApi = getRemoteExport<{
      configureApiClient?: (options?: {
        baseUrl?: string;
        getToken?: () => string | null;
      }) => void;
    }>(remote, 'partnerIntegrationApi');
    if (!remoteApi?.configureApiClient) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRemoteApiError(
        'Remote loaded but partnerIntegrationApi is missing. Check federation remote build/export shape.'
      );
      return;
    }
    setRemoteApiError('');
    remoteApi.configureApiClient({
      baseUrl: fluxorisApiBase,
      getToken: () => fluxorisToken || null,
    });
  }, [remote, fluxorisApiBase, fluxorisToken]);

  const parsedSchema = useMemo(() => {
    try {
      const parsed = JSON.parse(schemaText) as Record<string, unknown>;
      return { value: parsed, error: '' };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : 'Invalid JSON schema.',
      };
    }
  }, [schemaText]);

  const TemplateBuilderFlow = getRemoteExport<
    RemoteModule['TemplateBuilderFlow']
  >(remote, 'TemplateBuilderFlow');

  const handleExchangeToken = async () => {
    try {
      setExchangeError('');
      setExchangeLoading(true);
      const result = await api.post<{ access_token?: string; token?: string }>(
        '/api/partner/fluxoris/exchange-token'
      );
      const token = result.access_token || result.token || '';
      if (!token) {
        throw new Error('No token was returned from partner backend exchange.');
      }
      setFluxorisToken(token);
      localStorage.setItem(FLUXORIS_PARTNER_TOKEN_KEY, token);
    } catch (error) {
      setExchangeError(
        error instanceof Error ? error.message : 'Token exchange failed.'
      );
    } finally {
      setExchangeLoading(false);
    }
  };

  const handleOpenFluxorisWithToken = () => {
    const token = fluxorisToken.trim();
    if (!token) return;
    const appBase = fluxorisAppBase.trim().replace(/\/+$/, '');
    const bridgeUrl = `${appBase}/partner-token-bridge?token=${encodeURIComponent(token)}&next=${encodeURIComponent('/templates')}`;
    window.open(bridgeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Fluxoris MFE Dry Run</h1>
        <p className="text-sm text-muted-foreground">
          Host app consuming integration module.
        </p>
        <p className="mt-1 text-sm">
          Need run audit view?{' '}
          <Link className="underline" to="/integrations/fluxoris-run-details">
            Open Fluxoris Run Details page
          </Link>
        </p>
      </div>

      <div className="rounded-md border p-4">
        <h2 className="mb-3 text-base font-semibold">Fluxoris API Config</h2>
        <label className="mb-2 block text-sm font-medium">
          Fluxoris API Base URL
        </label>
        <input
          className="mb-3 w-full rounded border px-3 py-2 text-sm"
          value={fluxorisApiBase}
          onChange={(event) => setFluxorisApiBase(event.target.value)}
        />
        <label className="mb-2 block text-sm font-medium">
          Fluxoris App Base URL
        </label>
        <input
          className="mb-3 w-full rounded border px-3 py-2 text-sm"
          value={fluxorisAppBase}
          onChange={(event) => setFluxorisAppBase(event.target.value)}
          placeholder="http://localhost:5173"
        />
        <label className="mb-2 block text-sm font-medium">
          Fluxoris Bearer Token (optional override)
        </label>
        <button
          type="button"
          className="mb-2 rounded border px-3 py-1 text-xs"
          disabled={exchangeLoading}
          onClick={handleExchangeToken}
        >
          {exchangeLoading ? 'Exchanging...' : 'Get Token From Partner Backend'}
        </button>
        <textarea
          className="w-full rounded border px-3 py-2 font-mono text-xs"
          rows={3}
          placeholder="Paste Fluxoris JWT here for dry-run auth"
          value={fluxorisToken}
          onChange={(event) => setFluxorisToken(event.target.value.trim())}
        />
        {exchangeError && (
          <p className="mt-2 text-sm text-red-600">{exchangeError}</p>
        )}
        <button
          type="button"
          className="mt-2 rounded border px-3 py-1 text-xs"
          disabled={!fluxorisToken.trim()}
          onClick={handleOpenFluxorisWithToken}
        >
          Open Fluxoris App With This Token
        </button>
      </div>

      <div className="rounded-md border p-4">
        <label className="mb-2 block text-sm font-medium">Form ID</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="partner-form-123"
          value={formId}
          onChange={(event) => setFormId(event.target.value)}
        />
      </div>

      <div className="rounded-md border p-4">
        <label className="mb-2 block text-sm font-medium">Schema JSON</label>
        {schemaLoadError && (
          <p className="mb-2 text-sm text-amber-700">
            Could not auto-load form schema: {schemaLoadError}
          </p>
        )}
        <textarea
          className="h-44 w-full rounded border px-3 py-2 font-mono text-xs"
          value={schemaText}
          onChange={(event) => setSchemaText(event.target.value)}
        />
        {parsedSchema.error && (
          <p className="mt-2 text-sm text-red-600">
            Invalid schema JSON: {parsedSchema.error}
          </p>
        )}
      </div>

      {loadError && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          Could not load MFE integration module: {loadError}
        </div>
      )}
      {remoteApiError && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {remoteApiError}
        </div>
      )}

      {!loadError && !remote && (
        <div className="rounded-md border p-3 text-sm">
          Loading remote MFE...
        </div>
      )}

      {remote && (
        <>
          <div className="rounded-md border p-4">
            <h2 className="mb-3 text-base font-semibold">
              Template + Builder + Connect
            </h2>
            <label className="mb-2 block text-sm font-medium">
              Partner Status Webhook URL
            </label>
            <input
              className="mb-3 w-full rounded border px-3 py-2 text-sm"
              value={statusWebhookUrl}
              onChange={(event) => setStatusWebhookUrl(event.target.value)}
            />
            {TemplateBuilderFlow && parsedSchema.value && fluxorisToken && (
              // eslint-disable-next-line react-hooks/static-components
              <TemplateBuilderFlow
                formId={formId}
                schemaJson={parsedSchema.value}
                fieldMap={fieldMap}
                statusWebhookUrl={statusWebhookUrl}
                onConnected={(result) => {
                  setConnectedMessage(
                    `Connected. workflow_id=${result.workflow_id || '-'} webhook=${result.webhook?.path || '-'}`
                  );
                }}
              />
            )}
            {!fluxorisToken && (
              <p className="text-sm text-amber-700">
                Get a Fluxoris token first to load template and node catalog
                data.
              </p>
            )}
            {connectedMessage && (
              <p className="mt-2 text-sm text-green-700">{connectedMessage}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
