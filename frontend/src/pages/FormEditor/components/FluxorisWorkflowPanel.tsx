import { useState, useEffect } from 'react';
import { useFormStore } from '@/form/store/form.store';
import { initializeFluxoris } from '@/lib/fluxoris';
import { Loader2, GitBranch } from 'lucide-react';
import { toast } from 'sonner';

// Placeholder for the real component from @fluxoris/partner-mfe
const TemplateBuilderFlow = (props: any) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-muted/10 border-2 border-dashed border-primary/20 rounded-lg m-4">
      <GitBranch className="h-12 w-12 mb-4 text-primary/40" />
      <h3 className="text-lg font-semibold">Fluxoris Workflow Builder</h3>
      <p className="text-sm text-muted-foreground mt-2 mb-6">
        This is a placeholder for the Fluxoris MFE. 
        It would allow you to configure the workflow for form: <strong>{props.formId}</strong>.
      </p>
      <div className="text-[10px] font-mono bg-muted p-2 rounded text-left w-full overflow-hidden">
        <pre>{JSON.stringify(props.schemaJson, null, 2)}</pre>
      </div>
      <button 
        className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
        onClick={() => props.onConnected({ workflow_id: 'flow_123', webhook: { path: 'wf_abc' } })}
      >
        Mock Connect Workflow
      </button>
    </div>
  );
};

export function FluxorisWorkflowPanel() {
  const form = useFormStore((s) => s.form);
  const components = useFormStore((s) => s.components);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        await initializeFluxoris();
      } catch (err) {
        console.warn('Fluxoris initialization failed', err);
        setIsOffline(true);
      } finally {
        setLoading(false);
      }
    };
    setup();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
        <GitBranch className="h-12 w-12 mb-4 opacity-20" />
        <h3 className="text-sm font-semibold">Workflow Service Offline</h3>
        <p className="text-[10px] mt-2">
          The Fluxoris partner service is currently unreachable. 
          Please try again later.
        </p>
      </div>
    );
  }

  if (!form) return null;

  // Generate a simple JSON schema from form components (as recommended in README)
  const schemaJson = {
    type: 'object',
    properties: Object.values(components).reduce((acc: any, comp: any) => {
      if (comp.metadata?.label) {
        acc[comp.instanceId] = { type: 'string', title: comp.metadata.label };
      }
      return acc;
    }, {}),
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="text-sm font-semibold tracking-widest uppercase">Fluxoris Workflows</h2>
        <p className="text-[10px] text-muted-foreground mt-1">
          Connect your form to Fluxoris automated workflows.
        </p>
      </div>
      
      <TemplateBuilderFlow
        formId={form.formId}
        schemaJson={schemaJson}
        onConnected={(result: any) => {
          toast.success(`Connected to workflow: ${result.workflow_id}`);
          console.log('Fluxoris Connected:', result);
          // TODO: Store webhook.path in form metadata
        }}
      />
    </div>
  );
}
