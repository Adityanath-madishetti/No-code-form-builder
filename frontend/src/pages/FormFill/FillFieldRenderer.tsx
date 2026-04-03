import type { RuntimeComponent } from './runtimeLogic';
import { getShuffledOptions } from './runtimeLogic';

interface FillFieldRendererProps {
  component: RuntimeComponent;
  value: unknown;
  disabled: boolean;
  error?: string;
  shuffleSeed: string;
  onChange: (value: unknown) => void;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function renderError(error?: string) {
  if (!error) return null;
  return <p className="mt-1 text-xs text-destructive">{error}</p>;
}

export function FillFieldRenderer({
  component,
  value,
  disabled,
  error,
  shuffleSeed,
  onChange,
}: FillFieldRendererProps) {
  const props = component.props || {};
  const baseClass =
    'w-full rounded border border-input bg-background px-3 py-2 text-sm';
  const shuffleOptions = (props.shuffleOptions as boolean) === true;

  switch (component.componentType) {
    case 'heading':
      return (
        <h3 className="text-lg font-semibold">
          {String((props.text as string) || component.label || 'Heading')}
        </h3>
      );

    case 'single-line-text':
    case 'email':
    case 'phone':
    case 'url':
    case 'date':
    case 'time':
    case 'number':
    case 'decimal': {
      const typeMap: Record<string, string> = {
        email: 'email',
        phone: 'tel',
        url: 'url',
        date: 'date',
        time: 'time',
        number: 'number',
        decimal: 'number',
        'single-line-text': 'text',
      };
      return (
        <div>
          <input
            type={typeMap[component.componentType] || 'text'}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseClass}
            step={component.componentType === 'decimal' ? '0.01' : undefined}
            placeholder={String((props.placeholder as string) || '')}
          />
          {renderError(error)}
        </div>
      );
    }

    case 'multi-line-text':
    case 'rich-text-input':
      return (
        <div>
          <textarea
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`${baseClass} min-h-[90px]`}
            placeholder={String((props.placeholder as string) || '')}
          />
          {renderError(error)}
        </div>
      );

    case 'radio': {
      const raw = ((props.options as Array<{ id: string; label: string; value: string }>) || []);
      const options = getShuffledOptions(raw, shuffleOptions, `${shuffleSeed}:${component.componentId}:radio`);
      return (
        <div className="space-y-2">
          {options.map((option) => (
            <label key={option.id} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                disabled={disabled}
              />
              {option.label}
            </label>
          ))}
          {renderError(error)}
        </div>
      );
    }

    case 'checkbox': {
      const raw = ((props.options as Array<{ id: string; label: string; value: string }>) || []);
      const options = getShuffledOptions(raw, shuffleOptions, `${shuffleSeed}:${component.componentId}:checkbox`);
      const current = Array.isArray(value) ? value.map(String) : [];
      return (
        <div className="space-y-2">
          {options.map((option) => (
            <label key={option.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={current.includes(option.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...current, option.value]);
                  } else {
                    onChange(current.filter((item) => item !== option.value));
                  }
                }}
                disabled={disabled}
              />
              {option.label}
            </label>
          ))}
          {renderError(error)}
        </div>
      );
    }

    case 'dropdown': {
      const raw = ((props.options as Array<{ id: string; label: string; value: string }>) || []);
      const options = getShuffledOptions(raw, shuffleOptions, `${shuffleSeed}:${component.componentId}:dropdown`);
      return (
        <div>
          <select
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseClass}
          >
            <option value="">
              {(props.placeholder as string) || 'Select an option'}
            </option>
            {options.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {renderError(error)}
        </div>
      );
    }

    case 'single-choice-grid':
    case 'multi-choice-grid': {
      const rows = (props.rows as Array<{ id: string; label: string }>) || [];
      const rawColumns =
        (props.columns as Array<{ id: string; label: string; value: string }>) || [];
      const columns = getShuffledOptions(
        rawColumns,
        shuffleOptions,
        `${shuffleSeed}:${component.componentId}:grid`
      );
      const current = asRecord(value);
      return (
        <div className="overflow-auto">
          <table className="min-w-full border border-border text-xs">
            <thead>
              <tr>
                <th className="border border-border p-2 text-left">Row</th>
                {columns.map((column) => (
                  <th key={column.id} className="border border-border p-2 text-left">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="border border-border p-2">{row.label}</td>
                  {columns.map((column) => {
                    const rowValue = current[row.id];
                    const selected = Array.isArray(rowValue)
                      ? rowValue.map(String).includes(column.value)
                      : String(rowValue ?? '') === column.value;
                    return (
                      <td key={column.id} className="border border-border p-2">
                        <input
                          type={
                            component.componentType === 'single-choice-grid'
                              ? 'radio'
                              : 'checkbox'
                          }
                          checked={selected}
                          disabled={disabled}
                          onChange={(e) => {
                            const next = { ...current };
                            if (component.componentType === 'single-choice-grid') {
                              next[row.id] = column.value;
                            } else {
                              const rowArr = Array.isArray(rowValue)
                                ? rowValue.map(String)
                                : [];
                              if (e.target.checked) {
                                next[row.id] = [...rowArr, column.value];
                              } else {
                                next[row.id] = rowArr.filter((entry) => entry !== column.value);
                              }
                            }
                            onChange(next);
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {renderError(error)}
        </div>
      );
    }

    case 'matrix-table': {
      const rows = (props.rows as Array<{ id: string; label: string }>) || [];
      const rawColumns =
        (props.columns as Array<{ id: string; label: string; value: string }>) || [];
      const columns = getShuffledOptions(
        rawColumns,
        shuffleOptions,
        `${shuffleSeed}:${component.componentId}:matrix`
      );
      const current = asRecord(value);
      return (
        <div className="overflow-auto">
          <table className="min-w-full border border-border text-xs">
            <thead>
              <tr>
                <th className="border border-border p-2 text-left">Row</th>
                {columns.map((column) => (
                  <th key={column.id} className="border border-border p-2 text-left">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="border border-border p-2">{row.label}</td>
                  <td colSpan={columns.length} className="border border-border p-2">
                    <input
                      className={baseClass}
                      disabled={disabled}
                      value={String(current[row.id] ?? '')}
                      onChange={(e) => onChange({ ...current, [row.id]: e.target.value })}
                      placeholder="Enter value"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {renderError(error)}
        </div>
      );
    }

    case 'rating': {
      const maxRating = Number(props.maxRating || 5);
      return (
        <div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: maxRating }, (_, idx) => idx + 1).map((item) => (
              <button
                key={item}
                type="button"
                disabled={disabled}
                onClick={() => onChange(item)}
                className={`rounded border px-2 py-1 text-xs ${
                  Number(value) === item ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          {renderError(error)}
        </div>
      );
    }

    case 'linear-scale':
    case 'slider': {
      const min = Number(props.min ?? 0);
      const max = Number(props.max ?? 10);
      const step = Number(props.step ?? 1);
      return (
        <div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={Number(value ?? props.defaultValue ?? min)}
            disabled={disabled}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {String(value ?? props.defaultValue ?? min)}
          </p>
          {renderError(error)}
        </div>
      );
    }

    case 'address-block': {
      const current = asRecord(value);
      const update = (key: string, nextValue: string) =>
        onChange({ ...current, [key]: nextValue });
      return (
        <div className="grid gap-2">
          <input
            className={baseClass}
            placeholder="Address Line 1"
            value={String(current.line1 ?? '')}
            disabled={disabled}
            onChange={(e) => update('line1', e.target.value)}
          />
          {(props.showLine2 as boolean) && (
            <input
              className={baseClass}
              placeholder="Address Line 2"
              value={String(current.line2 ?? '')}
              disabled={disabled}
              onChange={(e) => update('line2', e.target.value)}
            />
          )}
          <input
            className={baseClass}
            placeholder="City"
            value={String(current.city ?? '')}
            disabled={disabled}
            onChange={(e) => update('city', e.target.value)}
          />
          {renderError(error)}
        </div>
      );
    }

    case 'name-block': {
      const current = asRecord(value);
      const update = (key: string, nextValue: string) =>
        onChange({ ...current, [key]: nextValue });
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className={baseClass}
            placeholder="First Name"
            value={String(current.firstName ?? '')}
            disabled={disabled}
            onChange={(e) => update('firstName', e.target.value)}
          />
          <input
            className={baseClass}
            placeholder="Last Name"
            value={String(current.lastName ?? '')}
            disabled={disabled}
            onChange={(e) => update('lastName', e.target.value)}
          />
          {renderError(error)}
        </div>
      );
    }

    case 'color-picker':
      return (
        <div>
          <input
            type="color"
            value={String(value ?? props.defaultColor ?? '#000000')}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-20 rounded border border-input bg-background"
          />
          {renderError(error)}
        </div>
      );

    case 'toggle':
      return (
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(value)}
              disabled={disabled}
              onChange={(e) => onChange(e.target.checked)}
            />
            {String((props.questionText as string) || component.label || 'Toggle')}
          </label>
          {renderError(error)}
        </div>
      );

    default:
      return (
        <div>
          <textarea
            value={toStringFallback(value)}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`${baseClass} min-h-[80px]`}
            placeholder={`Response for ${component.componentType}`}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Simplified input for {component.componentType}
          </p>
          {renderError(error)}
        </div>
      );
  }
}

function toStringFallback(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

