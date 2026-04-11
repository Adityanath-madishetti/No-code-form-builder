import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFormStore, formSelectors } from '@/form/store/form.store';
import type { AccessIdentity } from '@/form/components/base';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function toLocalDateTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

function fromLocalDateTime(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function FormPropertiesPanel() {
  const form = useFormStore(formSelectors.form);
  // const updateFormName = useFormStore((s) => s.updateFormName);
  // const updateFormMetadata = useFormStore((s) => s.updateFormMetadata);
  const updateFormAccess = useFormStore((s) => s.updateFormAccess);
  const updateFormSettings = useFormStore((s) => s.updateFormSettings);
  const { user } = useAuth();

  const ownerLabel = useMemo(() => {
    if (!form) return '';
    if (!form.metadata.authorId) return user?.email || 'Unknown';
    if (user?.uid === form.metadata.authorId) {
      return `${user.email} (You)`;
    }
    return form.metadata.authorId;
  }, [form, user?.uid, user?.email]);

  if (!form) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        No form loaded.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* <Field label="Form Title">
        <Input
          value={form.name}
          onChange={(e) => updateFormName(e.target.value)}
          placeholder="Untitled Form"
          className="text-sm"
        />
      </Field>

      <Field label="Description">
        <textarea
          value={form.metadata.description ?? ''}
          onChange={(e) => updateFormMetadata({ description: e.target.value })}
          placeholder="Describe what this form is for..."
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </Field> */}

      <Field label="Owner">
        <Input value={ownerLabel} readOnly className="text-sm" />
      </Field>

      <EmailChipsField
        label="Editors"
        entries={form.access.editors}
        onChange={(editors) => updateFormAccess({ editors })}
      />

      <EmailChipsField
        label="Reviewers"
        entries={form.access.reviewers}
        onChange={(reviewers) => updateFormAccess({ reviewers })}
      />

      <EmailChipsField
        label="Viewers"
        entries={form.access.viewers}
        onChange={(viewers) => updateFormAccess({ viewers })}
      />

      <Field label="Who Can Fill">
        <Select
          value={form.access.visibility}
          onValueChange={(value: 'public' | 'private' | 'link-only') =>
            updateFormAccess({ visibility: value })
          }
        >
          <SelectTrigger className="w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="link-only">Link-only (allowlisted)</SelectItem>
            <SelectItem value="public">Public</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Response Limit">
        <Input
          type="number"
          placeholder="Unlimited"
          min={0}
          className="text-sm"
          value={form.settings.submissionLimit ?? ''}
          onChange={(e) =>
            updateFormSettings({
              submissionLimit: e.target.value ? Number(e.target.value) : null,
            })
          }
        />
      </Field>

      <Field label="Deadline">
        <Input
          type="datetime-local"
          value={toLocalDateTime(form.settings.closeDate)}
          onChange={(e) =>
            updateFormSettings({ closeDate: fromLocalDateTime(e.target.value) })
          }
          className="text-sm"
        />
      </Field>

      <Field label="Collect Email">
        <Select
          value={form.settings.collectEmailMode}
          onValueChange={(value: 'none' | 'optional' | 'required') =>
            updateFormSettings({ collectEmailMode: value })
          }
        >
          <SelectTrigger className="w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Anonymous</SelectItem>
            <SelectItem value="optional">Optional</SelectItem>
            <SelectItem value="required">Required</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Submission Policy">
        <Select
          value={form.settings.submissionPolicy}
          onValueChange={(
            value: 'none' | 'edit_only' | 'resubmit_only' | 'edit_and_resubmit'
          ) => updateFormSettings({ submissionPolicy: value })}
        >
          <SelectTrigger className="w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Submit once (no edit)</SelectItem>
            <SelectItem value="edit_only">Edit existing only</SelectItem>
            <SelectItem value="resubmit_only">Submit again only</SelectItem>
            <SelectItem value="edit_and_resubmit">
              Edit existing and submit again
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Can Viewer View Their Submission">
        <Select
          value={form.settings.canViewOwnSubmission ? 'yes' : 'no'}
          onValueChange={(value) =>
            updateFormSettings({ canViewOwnSubmission: value === 'yes' })
          }
        >
          <SelectTrigger className="w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Confirmation Message">
        <textarea
          value={form.settings.confirmationMessage}
          onChange={(e) =>
            updateFormSettings({ confirmationMessage: e.target.value })
          }
          rows={2}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </Field>
    </div>
  );
}

function EmailChipsField({
  label,
  entries,
  onChange,
}: {
  label: string;
  entries: AccessIdentity[];
  onChange: (entries: AccessIdentity[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const addEmail = (raw: string) => {
    const email = normalizeEmail(raw);
    if (!email) return;
    if (entries.some((entry) => normalizeEmail(entry.email) === email)) return;
    onChange([...entries, { email }]);
  };

  return (
    <Field label={label}>
      <div className="rounded-md border border-border p-2">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {entries.map((entry) => (
            <span
              key={entry.uid || entry.email}
              className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs"
            >
              {entry.email}
              <button
                type="button"
                onClick={() =>
                  onChange(
                    entries.filter((item) => item.email !== entry.email)
                  )
                }
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addEmail(draft);
                setDraft('');
              }
            }}
            placeholder="Type email and press Enter"
            className="text-sm"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              addEmail(draft);
              setDraft('');
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </Field>
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
