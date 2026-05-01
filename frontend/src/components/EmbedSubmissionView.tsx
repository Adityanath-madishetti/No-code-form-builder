// frontend/src/components/EmbedSubmissionView.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { AlertCircle } from 'lucide-react';
import {
  runtimeFormSelector,
  useRuntimeFormStore,
} from '@/form/renderer/viewRenderer/runtimeForm.store';
import type {
  PublicFormData,
  PublicPageData,
  SubmissionEntry,
} from '@/form/renderer/viewRenderer/runtimeForm.types';
import { FormThemeProvider } from '@/form/theme/FormThemeProvider';
import { backendToFrontend } from '@/lib/frontendBackendCompArray';
import { getComponentRenderer } from '@/form/registry/componentRegistry';
import type { ComponentID } from '@/form/components/base';
import { sharedProseClasses } from '@/components/RichTextEditor';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const MF_SOURCE = 'submission-view-mf';
const HOST_SOURCE = 'host-app';
const MF_VERSION = '1.0';
const MAX_FRAME_HEIGHT = 20000;

type SubmissionLike =
  | SubmissionEntry['pages']
  | Record<string, unknown>
  | string
  | null
  | undefined;

type FormSchemaLike = PublicFormData | string | null | undefined;
type ParsedFormSchema = PublicFormData | undefined;

type EmbedSubmissionViewProps = {
  formSchema?: FormSchemaLike;
  responseData?: SubmissionLike;
  skipInit?: boolean;
};

type HostToMfMessage = {
  source?: string;
  type?: string;
  version?: string;
  requestId?: string;
  payload?: {
    formSchema?: FormSchemaLike;
    responseData?: SubmissionLike;
  };
};

type MfToHostMessage = {
  source: typeof MF_SOURCE;
  type: 'MF_READY' | 'MF_RENDERED' | 'MF_ERROR' | 'FRAME_RESIZE' | 'MF_PONG';
  version: typeof MF_VERSION;
  requestId?: string;
  payload?: Record<string, unknown>;
};

function flattenResponses(
  pages: SubmissionEntry['pages']
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const page of pages || []) {
    for (const response of page.responses || []) {
      out[response.componentId] = response.response;
    }
  }
  return out;
}

function parseSubmissionValue(value: unknown): SubmissionLike {
  if (!value) return undefined;
  if (typeof value !== 'string') return value as SubmissionLike;
  try {
    return JSON.parse(value) as SubmissionLike;
  } catch {
    return undefined;
  }
}

function parseFormSchemaValue(value: unknown): ParsedFormSchema {
  if (!value) return undefined;
  if (typeof value !== 'string') {
    return typeof value === 'object' && value !== null && 'version' in value
      ? (value as PublicFormData)
      : undefined;
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'object' && parsed !== null && 'version' in parsed
      ? (parsed as PublicFormData)
      : undefined;
  } catch {
    return undefined;
  }
}

function parseResponseData(input: SubmissionLike): {
  flatValues: Record<string, unknown>;
  respondedPageNos: number[];
} {
  if (!input) return { flatValues: {}, respondedPageNos: [] };

  if (typeof input === 'string') {
    return parseResponseData(parseSubmissionValue(input));
  }

  if (Array.isArray(input)) {
    const respondedPageNos = input
      .filter((page) => (page.responses || []).length > 0)
      .map((page) => page.pageNo);
    return {
      flatValues: flattenResponses(input),
      respondedPageNos,
    };
  }

  return {
    flatValues: input,
    respondedPageNos: [],
  };
}

export default function EmbedSubmissionView({
  formSchema,
  responseData,
  skipInit = false,
}: EmbedSubmissionViewProps) {
  const [searchParams] = useSearchParams();
  const targetOriginRef = useRef<string>('*');
  const lastRequestIdRef = useRef<string | undefined>(undefined);
  const [messageFormSchema, setMessageFormSchema] = useState<FormSchemaLike>();
  const [messageResponseData, setMessageResponseData] =
    useState<SubmissionLike>();
  const methods = useForm<Record<string, unknown>>({
    shouldUnregister: false,
    defaultValues: {},
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const { initRuntimeForm } = useRuntimeFormStore();

  const isEmbedded = window.parent !== window;

  const postToHost = useCallback(
    (message: MfToHostMessage) => {
      if (!isEmbedded) return;
      window.parent.postMessage(message, targetOriginRef.current);
    },
    [isEmbedded]
  );

  useEffect(() => {
    let animationFrameId: number;
    const timeoutIds: number[] = [];

    const resolveOrigin = (value: string): string | null => {
      try {
        return new URL(value).origin;
      } catch {
        return null;
      }
    };

    const hostOriginParam = searchParams.get('hostOrigin');
    if (hostOriginParam) {
      targetOriginRef.current = resolveOrigin(hostOriginParam) ?? '*';
    } else if (document.referrer) {
      targetOriginRef.current = resolveOrigin(document.referrer) ?? '*';
    }

    const sendHeight = () => {
      if (!containerRef.current) return;
      const contentHeight = Math.max(
        containerRef.current.offsetHeight,
        containerRef.current.scrollHeight
      );
      const height = Math.min(contentHeight + 32, MAX_FRAME_HEIGHT);
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(() => {
        postToHost({
          source: MF_SOURCE,
          type: 'FRAME_RESIZE',
          version: MF_VERSION,
          payload: { height },
        });
      });
    };

    const handleHostMessage = (event: MessageEvent<HostToMfMessage>) => {
      if (
        targetOriginRef.current !== '*' &&
        event.origin !== targetOriginRef.current
      ) {
        return;
      }

      const data = event.data;
      if (!data || data.source !== HOST_SOURCE || data.version !== MF_VERSION)
        return;

      if (data.type === 'MF_PING') {
        postToHost({
          source: MF_SOURCE,
          type: 'MF_PONG',
          version: MF_VERSION,
          requestId: data.requestId,
        });
        return;
      }

      if (data.type !== 'MF_INIT' && data.type !== 'MF_UPDATE') return;

      if (!data.payload?.formSchema) {
        postToHost({
          source: MF_SOURCE,
          type: 'MF_ERROR',
          version: MF_VERSION,
          requestId: data.requestId,
          payload: {
            code: 'INVALID_SCHEMA',
            message: 'MF_INIT/MF_UPDATE requires payload.formSchema',
          },
        });
        return;
      }

      if (data.requestId) {
        lastRequestIdRef.current = data.requestId;
      }
      setMessageFormSchema(data.payload.formSchema);
      setMessageResponseData(data.payload.responseData);
    };

    window.addEventListener('message', handleHostMessage);

    const postReady = () => {
      postToHost({
        source: MF_SOURCE,
        type: 'MF_READY',
        version: MF_VERSION,
        payload: {
          capabilities: ['init', 'update', 'resize', 'ping'],
        },
      });
    };

    postReady();
    timeoutIds.push(window.setTimeout(postReady, 250));
    timeoutIds.push(window.setTimeout(postReady, 1000));

    sendHeight();
    timeoutIds.push(window.setTimeout(sendHeight, 500));

    const resizeObserver = new ResizeObserver(sendHeight);
    const mutationObserver = new MutationObserver(sendHeight);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      mutationObserver.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      timeoutIds.forEach((id) => window.clearTimeout(id));
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('message', handleHostMessage);
    };
  }, [postToHost, searchParams]);

  const parsedSchema = useMemo(() => {
    const schemaFromQuery = parseFormSchemaValue(
      searchParams.get('formSchema')
    );
    const schemaSource = messageFormSchema ?? formSchema ?? schemaFromQuery;
    return parseFormSchemaValue(schemaSource);
  }, [formSchema, messageFormSchema, searchParams]);

  const parsedResponseData = useMemo(() => {
    const queryResponseData = parseSubmissionValue(
      searchParams.get('responseData')
    );
    const source = messageResponseData ?? responseData ?? queryResponseData;
    return parseResponseData(source);
  }, [messageResponseData, responseData, searchParams]);

  useEffect(() => {
    if (skipInit || !parsedSchema) {
      return;
    }
    try {
      initRuntimeForm(parsedSchema);
    } catch {
      postToHost({
        source: MF_SOURCE,
        type: 'MF_ERROR',
        version: MF_VERSION,
        requestId: lastRequestIdRef.current,
        payload: {
          code: 'RUNTIME_INIT_FAILED',
          message: 'Unable to initialize submission view runtime',
        },
      });
    }
  }, [initRuntimeForm, parsedSchema, postToHost, skipInit]);

  useEffect(() => {
    methods.reset(parsedResponseData.flatValues);
  }, [methods, parsedResponseData.flatValues]);

  const formData = useRuntimeFormStore((state) => state.formData);
  const globalTheme = useRuntimeFormStore(
    useShallow(runtimeFormSelector.theme)
  );

  const visiblePages = useMemo(() => {
    if (!parsedSchema) return [];

    if (parsedResponseData.respondedPageNos.length > 0) {
      const pageNoSet = new Set(parsedResponseData.respondedPageNos);
      return parsedSchema.version.pages.filter((page) =>
        pageNoSet.has(page.pageNo)
      );
    }

    return parsedSchema.version.pages.filter((page) =>
      page.components.some((component) =>
        Object.prototype.hasOwnProperty.call(
          parsedResponseData.flatValues,
          component.componentId
        )
      )
    );
  }, [
    parsedSchema,
    parsedResponseData.flatValues,
    parsedResponseData.respondedPageNos,
  ]);

  useEffect(() => {
    if (!parsedSchema) return;
    postToHost({
      source: MF_SOURCE,
      type: 'MF_RENDERED',
      version: MF_VERSION,
      requestId: lastRequestIdRef.current,
      payload: {
        pageCount: parsedSchema.version.pages.length,
        visiblePageCount: visiblePages.length,
      },
    });
  }, [parsedSchema, postToHost, visiblePages.length]);

  const renderPage = (page: PublicPageData) => {
    return (
      <div key={page.pageId} className="space-y-4">
        {(page.title || page.description) && (
          <Card>
            <CardHeader>
              <div className="text-4xl font-semibold tracking-tight">
                {page.title}
              </div>
            </CardHeader>
            {page.description && (
              <CardContent>
                <div className={`tracking-tight ${sharedProseClasses}`}>
                  {page.description}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <div className="space-y-4">
          {page.components.map((comp) => {
            const frontendId = backendToFrontend[comp.componentType];
            const Renderer = getComponentRenderer(frontendId as ComponentID);

            if (!Renderer) {
              return (
                <div
                  key={comp.componentId}
                  className="border bg-red-50 p-4 text-red-500"
                >
                  Unknown component type: {comp.componentType}
                </div>
              );
            }

            return (
              <Renderer
                key={comp.componentId}
                metadata={null as never}
                props={comp.props as never}
                validation={comp.validation as never}
                instanceId={comp.componentId}
              />
            );
          })}
        </div>
      </div>
    );
  };

  if (!parsedSchema || !formData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <div className="mb-2 flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            Error loading submission view
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Provide a valid form schema in `formSchema` and submission payload
            in `responseData`.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FormThemeProvider globalTheme={globalTheme}>
      <div
        ref={containerRef}
        className="mx-auto mt-15 mb-15 max-w-3xl min-w-3xl"
      >
        <FormProvider {...methods}>
          <form className="space-y-6">
            <Card>
              <CardHeader>
                <div className="w-full bg-transparent text-5xl font-bold tracking-tight text-foreground outline-none">
                  <h1>{formData.form.title}</h1>
                </div>
              </CardHeader>
              {formData.version.meta.description && (
                <CardContent>
                  <div
                    className={sharedProseClasses}
                    dangerouslySetInnerHTML={{
                      __html: formData.version.meta.description,
                    }}
                  />
                </CardContent>
              )}
            </Card>

            <Separator className="mt-5" />

            {visiblePages.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No submitted input found in the provided response data.
                </CardContent>
              </Card>
            ) : (
              <fieldset
                disabled
                className="pointer-events-none m-0 min-w-0 space-y-8 border-0 p-0"
              >
                {visiblePages.map((page, index) => (
                  <div key={page.pageId} className="space-y-8">
                    {renderPage(page)}
                    {index < visiblePages.length - 1 && <Separator />}
                  </div>
                ))}
              </fieldset>
            )}
          </form>
        </FormProvider>
      </div>
    </FormThemeProvider>
  );
}
