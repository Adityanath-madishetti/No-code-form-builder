// src/pages/FormEditor/components/ConditionBuilder.tsx
/**
 * Recursive condition tree builder.
 * Renders a nested AND/OR group of condition rows.
 */
import { Plus, Trash2, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  Condition,
  ConditionGroup,
  ConditionLeaf,
  ComparisonOp,
  LogicalOp,
} from '@/form/logic/logicTypes';
import {
  COMPARISON_OPS,
  COMPARISON_OP_LABELS,
  createConditionLeaf,
  createConditionGroup,
} from '@/form/logic/logicTypes';
import { formSelectors, useFormStore } from '@/form/store/form.store';
import { ComponentIDs } from '@/form/components/base';
import { useState, useCallback } from 'react';

interface FieldOption {
  id: string;
  label: string;
}

interface ConditionBuilderProps {
  condition: Condition;
  fields: FieldOption[];
  onChange: (updated: Condition) => void;
  onRemove?: () => void;
  depth?: number;
}

export function ConditionBuilder({
  condition,
  fields,
  onChange,
  onRemove,
  depth = 0,
}: ConditionBuilderProps) {
  if (condition.type === 'leaf') {
    return (
      <LeafRow
        condition={condition}
        fields={fields}
        onChange={onChange}
        onRemove={onRemove}
      />
    );
  }

  return (
    <GroupBlock
      group={condition}
      fields={fields}
      onChange={onChange}
      onRemove={onRemove}
      depth={depth}
    />
  );
}

// ── Leaf Row ──

function LeafRow({
  condition,
  fields,
  onChange,
  onRemove,
}: {
  condition: ConditionLeaf;
  fields: FieldOption[];
  onChange: (c: Condition) => void;
  onRemove?: () => void;
}) {
  const needsValue =
    condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty';

  const component = useFormStore(
    formSelectors.componentById(condition.instanceId)
  );

  const isDropdownComp = component?.id === ComponentIDs.Dropdown;
  const isRadioComp = component?.id === ComponentIDs.Radio;
  const hasSelectableOptions = isRadioComp || isDropdownComp;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options = (component?.props as any)?.options || [];

  const isPredefined = options.some(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (opt: any) => String(opt.value) === String(condition.value)
  );
  const hasValue = condition.value !== undefined && condition.value !== '';
  const isCustomValue = hasValue && !isPredefined;

  const [forceCustom, setForceCustom] = useState(false);
  const showCustomInput = forceCustom || isCustomValue;

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1.5">
      {/* Field selector */}
      <select
        value={condition.instanceId}
        onChange={(e) => {
          setForceCustom(false);
          onChange({ ...condition, instanceId: e.target.value, value: '' });
        }}
        className="h-7 min-w-0 flex-1 rounded border border-input bg-background px-1.5 text-xs"
      >
        <option value="">Select field…</option>
        {fields.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>

      {/* Operator selector */}
      <select
        value={condition.operator}
        onChange={(e) =>
          onChange({ ...condition, operator: e.target.value as ComparisonOp })
        }
        className="h-7 min-w-0 rounded border border-input bg-background px-1.5 text-xs"
      >
        {COMPARISON_OPS.map((op) => (
          <option key={op} value={op}>
            {COMPARISON_OP_LABELS[op]}
          </option>
        ))}
      </select>

      {/* Value input / select */}
      {needsValue &&
        (hasSelectableOptions ? (
          <>
            <select
              value={
                showCustomInput ? '__custom__' : String(condition.value ?? '')
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__custom__') {
                  setForceCustom(true);
                  onChange({ ...condition, value: '' }); // Clear value so they can type
                } else {
                  setForceCustom(false);
                  onChange({ ...condition, value: val });
                }
              }}
              className="h-7 w-24 min-w-0 rounded border border-input bg-background px-1.5 text-xs"
            >
              <option value="" disabled>
                Select...
              </option>
              {options.map((opt: { id: string; value: string }) => (
                <option key={opt.id} value={opt.value}>
                  {opt.value}
                </option>
              ))}
              <option value="__custom__">Custom...</option>
            </select>

            {/* Render the actual text input right next to the select if Custom is chosen */}
            {showCustomInput && (
              <input
                type="text"
                value={String(condition.value ?? '')}
                onChange={(e) =>
                  onChange({ ...condition, value: e.target.value })
                }
                placeholder="Custom value"
                autoFocus // Automatically focus so they can start typing
                className="h-7 w-24 min-w-0 rounded border border-input bg-background px-1.5 text-xs"
              />
            )}
          </>
        ) : (
          <input
            type="text"
            value={String(condition.value ?? '')}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            placeholder="value"
            className="h-7 w-24 min-w-0 rounded border border-input bg-background px-1.5 text-xs"
          />
        ))}

      {/* Remove */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
          title="Remove condition"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ── Group Block ──

function GroupBlock({
  group,
  fields,
  onChange,
  onRemove,
  depth,
}: {
  group: ConditionGroup;
  fields: FieldOption[];
  onChange: (c: Condition) => void;
  onRemove?: () => void;
  depth: number;
}) {
  const updateChild = useCallback(
    (index: number, updated: Condition) => {
      const newConditions = [...group.conditions];
      newConditions[index] = updated;
      onChange({ ...group, conditions: newConditions });
    },
    [group, onChange]
  );

  const removeChild = useCallback(
    (index: number) => {
      const newConditions = group.conditions.filter((_, i) => i !== index);
      if (newConditions.length === 0) {
        onRemove?.();
      } else {
        onChange({ ...group, conditions: newConditions });
      }
    },
    [group, onChange, onRemove]
  );

  const addLeaf = useCallback(() => {
    onChange({
      ...group,
      conditions: [...group.conditions, createConditionLeaf()],
    });
  }, [group, onChange]);

  const addGroup = useCallback(() => {
    onChange({
      ...group,
      conditions: [
        ...group.conditions,
        createConditionGroup(group.operator === 'AND' ? 'OR' : 'AND'),
      ],
    });
  }, [group, onChange]);

  const toggleOp = useCallback(() => {
    const newOp: LogicalOp = group.operator === 'AND' ? 'OR' : 'AND';
    onChange({ ...group, operator: newOp });
  }, [group, onChange]);

  const borderColor =
    depth % 2 === 0 ? 'border-primary/30' : 'border-amber-400/30';
  const bgColor = depth % 2 === 0 ? 'bg-primary/5' : 'bg-amber-400/5';

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-2`}>
      {/* Header: operator toggle + remove */}
      <div className="mb-1.5 flex items-center gap-1.5">
        <button
          onClick={toggleOp}
          className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-colors ${
            group.operator === 'AND'
              ? 'bg-primary/20 text-primary'
              : 'bg-amber-400/20 text-amber-600'
          }`}
        >
          {group.operator}
        </button>
        <span className="flex-1 text-[10px] text-muted-foreground">
          {group.operator === 'AND' ? 'All must match' : 'Any must match'}
        </span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-muted-foreground transition-colors hover:text-destructive"
            title="Remove group"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Children */}
      <div className="space-y-1.5">
        {group.conditions.map((child, index) => (
          <ConditionBuilder
            key={child.id}
            condition={child}
            fields={fields}
            onChange={(updated) => updateChild(index, updated)}
            onRemove={() => removeChild(index)}
            depth={depth + 1}
          />
        ))}
      </div>

      {/* Add buttons */}
      <div className="mt-1.5 flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px]"
          onClick={addLeaf}
        >
          <Plus className="mr-0.5 h-2.5 w-2.5" />
          Condition
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px]"
          onClick={addGroup}
        >
          <GitBranch className="mr-0.5 h-2.5 w-2.5" />
          Group
        </Button>
      </div>
    </div>
  );
}
