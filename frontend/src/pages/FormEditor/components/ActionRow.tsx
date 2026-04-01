// src/pages/FormEditor/components/ActionRow.tsx
/**
 * A single action row: [Action Type ▾] [Target ▾] [Value?]
 */
import { Trash2 } from 'lucide-react';
import type { RuleAction, ActionType } from '@/form/logic/logicTypes';
import { ACTION_TYPES, ACTION_TYPE_LABELS, ACTION_TYPE_COLORS } from '@/form/logic/logicTypes';

interface TargetOption {
  id: string;
  label: string;
  type: 'component' | 'page';
}

interface ActionRowProps {
  action: RuleAction;
  targets: TargetOption[];
  onChange: (updated: RuleAction) => void;
  onRemove?: () => void;
}

export function ActionRow({ action, targets, onChange, onRemove }: ActionRowProps) {
  const needsValue = action.type === 'SET_VALUE';
  const isPageAction = action.type === 'SKIP_PAGE';

  const filteredTargets = isPageAction
    ? targets.filter((t) => t.type === 'page')
    : targets.filter((t) => t.type === 'component');

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1.5">
      {/* Action type */}
      <select
        value={action.type}
        onChange={(e) => onChange({ ...action, type: e.target.value as ActionType, targetId: '' })}
        className={`h-7 min-w-0 rounded border border-input bg-background px-1.5 text-xs font-medium ${ACTION_TYPE_COLORS[action.type]}`}
      >
        {ACTION_TYPES.map((t) => (
          <option key={t} value={t}>
            {ACTION_TYPE_LABELS[t]}
          </option>
        ))}
      </select>

      {/* Target selector */}
      <select
        value={action.targetId}
        onChange={(e) => onChange({ ...action, targetId: e.target.value })}
        className="h-7 min-w-0 flex-1 rounded border border-input bg-background px-1.5 text-xs"
      >
        <option value="">{isPageAction ? 'Select page…' : 'Select field…'}</option>
        {filteredTargets.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>

      {/* Value input (only for SET_VALUE) */}
      {needsValue && (
        <input
          type="text"
          value={String(action.value ?? '')}
          onChange={(e) => onChange({ ...action, value: e.target.value })}
          placeholder="value"
          className="h-7 w-24 min-w-0 rounded border border-input bg-background px-1.5 text-xs"
        />
      )}

      {/* Remove */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
          title="Remove action"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
