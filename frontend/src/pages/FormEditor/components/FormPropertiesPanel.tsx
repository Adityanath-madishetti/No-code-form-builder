// src/pages/FormEditor/components/FormPropertiesPanel.tsx
import { useFormStore, formSelectors } from '@/form/store/formStore';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function FormPropertiesPanel() {
  const form = useFormStore(formSelectors.form);
  const updateFormName = useFormStore((s) => s.updateFormName);
  const updateFormMetadata = useFormStore((s) => s.updateFormMetadata);

  if (!form) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        No form loaded.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Title */}
      <Field label="Form Title">
        <Input
          value={form.name}
          onChange={(e) => updateFormName(e.target.value)}
          placeholder="Untitled Form"
          className="text-sm"
        />
      </Field>

      {/* Description */}
      <Field label="Description">
        <textarea
          value={form.metadata.description ?? ''}
          onChange={(e) => updateFormMetadata({ description: e.target.value })}
          placeholder="Describe what this form is for..."
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </Field>

      {/* Access */}
      <Field label="Access">
        <Select defaultValue="private">
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="Select access level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Private — Only you</SelectItem>
            <SelectItem value="link">Anyone with link</SelectItem>
            <SelectItem value="public">Public — Listed</SelectItem>
            <SelectItem value="password">Password protected</SelectItem>
            <SelectItem value="domain">Domain restricted</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {/* Status */}
      <Field label="Status">
        <Select defaultValue="draft">
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="Form status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active (accepting responses)</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {/* Response Settings */}
      <Field label="Response Limit">
        <Input
          type="number"
          placeholder="Unlimited"
          min={0}
          className="text-sm"
        />
      </Field>

      {/* Submission message */}
      <Field label="Confirmation Message">
        <textarea
          placeholder="Thank you for your submission!"
          rows={2}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </Field>

      {/* Collect respondent email */}
      <Field label="Collect Email">
        <Select defaultValue="no">
          <SelectTrigger className="w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no">Don't collect</SelectItem>
            <SelectItem value="optional">Optional</SelectItem>
            <SelectItem value="required">Required</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {/* Allow edit after submit */}
      <Field label="Edit After Submit">
        <Select defaultValue="no">
          <SelectTrigger className="w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no">Disabled</SelectItem>
            <SelectItem value="yes">Allow editing</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {/* Metadata (read-only) */}
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          Metadata
        </p>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Created</span>
            <span>{form.metadata.createdAt ? new Date(form.metadata.createdAt).toLocaleDateString() : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span>Updated</span>
            <span>{form.metadata.updatedAt ? new Date(form.metadata.updatedAt).toLocaleDateString() : '—'}</span>
          </div>
          {form.metadata.version !== undefined && (
            <div className="flex justify-between">
              <span>Version</span>
              <span>v{form.metadata.version}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
