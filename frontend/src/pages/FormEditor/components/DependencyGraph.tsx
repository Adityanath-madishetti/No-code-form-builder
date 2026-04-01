// src/pages/FormEditor/components/DependencyGraph.tsx
/**
 * Dependency Graph — Visualizes how fields connect through rules.
 * Simple list-based view showing source → target edges color-coded by action.
 */
import { useMemo } from 'react';
import { GitBranch } from 'lucide-react';
import { useLogicStore, getDependencyEdges } from '@/form/logic/logicStore';
import { useFormStore } from '@/form/store/formStore';
import { ACTION_TYPE_LABELS, ACTION_TYPE_COLORS } from '@/form/logic/logicTypes';

export function DependencyGraph() {
  const rules = useLogicStore((s) => s.rules);
  const components = useFormStore((s) => s.components);
  const pages = useFormStore((s) => s.pages);
  const formPages = useFormStore((s) => s.form?.pages ?? []);

  const edges = useMemo(() => getDependencyEdges(rules), [rules]);

  const getLabel = (id: string): string => {
    if (components[id]) return components[id].metadata.label || components[id].id;
    const pageIdx = formPages.indexOf(id);
    if (pageIdx >= 0) return pages[id]?.title || `Page ${pageIdx + 1}`;
    return id.slice(0, 8) + '…';
  };

  if (edges.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
        <GitBranch className="h-6 w-6 opacity-30" />
        <p className="text-xs">No dependencies yet.</p>
        <p className="text-[10px] opacity-70">
          Create rules to see the dependency graph.
        </p>
      </div>
    );
  }

  // Group edges by rule
  const edgesByRule = new Map<string, typeof edges>();
  for (const edge of edges) {
    const existing = edgesByRule.get(edge.ruleId) || [];
    existing.push(edge);
    edgesByRule.set(edge.ruleId, existing);
  }

  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Dependencies ({edges.length})
      </h4>

      <div className="space-y-1.5">
        {edges.map((edge, i) => {
          const ruleName = rules.find((r) => r.ruleId === edge.ruleId)?.name || 'Unknown';
          return (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded border border-border bg-muted/30 px-2 py-1"
            >
              {/* Source */}
              <span className="min-w-0 truncate rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-mono text-blue-600">
                {getLabel(edge.sourceFieldId)}
              </span>

              {/* Arrow */}
              <span className="shrink-0 text-[10px] text-muted-foreground">→</span>

              {/* Action */}
              <span className={`shrink-0 text-[10px] font-semibold ${ACTION_TYPE_COLORS[edge.actionType]}`}>
                {ACTION_TYPE_LABELS[edge.actionType]}
              </span>

              {/* Arrow */}
              <span className="shrink-0 text-[10px] text-muted-foreground">→</span>

              {/* Target */}
              <span className="min-w-0 truncate rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-mono text-amber-600">
                {getLabel(edge.targetId)}
              </span>

              {/* Rule name tooltip */}
              <span
                className="ml-auto shrink-0 text-[9px] text-muted-foreground/50"
                title={ruleName}
              >
                {ruleName.length > 12 ? ruleName.slice(0, 12) + '…' : ruleName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
