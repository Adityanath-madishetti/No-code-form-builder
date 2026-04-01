// src/pages/FormEditor/components/LogicPanel.tsx
/**
 * Logic Panel — Sidebar content listing all rules and formulas.
 * Click a rule to open it in the playground. Manage rules from here.
 */
import { Zap, Calculator, Trash2, Copy, Power, GitBranch, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLogicStore } from '@/form/logic/logicStore';
import { ACTION_TYPE_LABELS, ACTION_TYPE_COLORS } from '@/form/logic/logicTypes';
import { DependencyGraph } from './DependencyGraph';

export function LogicPanel() {
  const rules = useLogicStore((s) => s.rules);
  const formulas = useLogicStore((s) => s.formulas);
  const activeRuleId = useLogicStore((s) => s.activeRuleId);
  const activeFormulaId = useLogicStore((s) => s.activeFormulaId);
  const addRule = useLogicStore((s) => s.addRule);
  const removeRule = useLogicStore((s) => s.removeRule);
  const duplicateRule = useLogicStore((s) => s.duplicateRule);
  const toggleRule = useLogicStore((s) => s.toggleRule);
  const setActiveRule = useLogicStore((s) => s.setActiveRule);
  const addFormula = useLogicStore((s) => s.addFormula);
  const removeFormula = useLogicStore((s) => s.removeFormula);
  const setActiveFormula = useLogicStore((s) => s.setActiveFormula);

  const [showGraph, setShowGraph] = useState(false);

  const hasContent = rules.length > 0 || formulas.length > 0;

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Action buttons */}
      <div className="flex gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => addRule()}
        >
          <Zap className="mr-1 h-3 w-3" />
          Add Rule
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => addFormula()}
        >
          <Calculator className="mr-1 h-3 w-3" />
          Add Formula
        </Button>
      </div>

      {/* Empty state */}
      {!hasContent && (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
          <Zap className="h-8 w-8 opacity-20" />
          <p className="text-xs font-medium">No logic rules yet</p>
          <p className="text-[10px] opacity-70">
            Add conditional rules to show, hide, or modify
            fields based on user input.
          </p>
        </div>
      )}

      {/* Rules list */}
      {rules.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Rules ({rules.length})
          </h4>
          <div className="space-y-1">
            {rules.map((rule) => {
              const isActive = activeRuleId === rule.ruleId;
              return (
                <div
                  key={rule.ruleId}
                  onClick={() => setActiveRule(rule.ruleId)}
                  className={`group cursor-pointer rounded-md border px-2.5 py-1.5 transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/30 hover:bg-muted/50'
                  } ${!rule.enabled ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Zap className={`h-3 w-3 shrink-0 ${isActive ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    <span className="flex-1 min-w-0 truncate text-xs font-medium">
                      {rule.name}
                    </span>

                    {/* Quick actions */}
                    <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleRule(rule.ruleId); }}
                        title={rule.enabled ? 'Disable' : 'Enable'}
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Power className="h-2.5 w-2.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateRule(rule.ruleId); }}
                        title="Duplicate"
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="h-2.5 w-2.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeRule(rule.ruleId); }}
                        title="Delete"
                        className="rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Action badges */}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {rule.thenActions.slice(0, 3).map((action) => (
                      <span
                        key={action.id}
                        className={`rounded px-1 py-0 text-[9px] font-semibold ${ACTION_TYPE_COLORS[action.type]} bg-current/10`}
                        style={{ backgroundColor: 'transparent' }}
                      >
                        {ACTION_TYPE_LABELS[action.type]}
                      </span>
                    ))}
                    {rule.thenActions.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{rule.thenActions.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Formulas list */}
      {formulas.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Formulas ({formulas.length})
          </h4>
          <div className="space-y-1">
            {formulas.map((formula) => {
              const isActive = activeFormulaId === formula.ruleId;
              return (
                <div
                  key={formula.ruleId}
                  onClick={() => setActiveFormula(formula.ruleId)}
                  className={`group cursor-pointer rounded-md border px-2.5 py-1.5 transition-all ${
                    isActive
                      ? 'border-violet-500 bg-violet-500/5 shadow-sm'
                      : 'border-border hover:border-violet-500/30 hover:bg-muted/50'
                  } ${!formula.enabled ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Calculator className={`h-3 w-3 shrink-0 ${isActive ? 'text-violet-500' : 'text-muted-foreground'}`} />
                    <span className="flex-1 min-w-0 truncate text-xs font-medium">
                      {formula.name}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFormula(formula.ruleId); }}
                      title="Delete"
                      className="hidden rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors group-hover:block"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  {formula.expression && (
                    <p className="mt-0.5 truncate text-[10px] font-mono text-muted-foreground">
                      {formula.expression}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dependency Graph toggle */}
      {hasContent && (
        <div className="border-t border-border pt-2">
          <button
            onClick={() => setShowGraph(!showGraph)}
            className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <GitBranch className="h-3 w-3" />
            <span className="flex-1 text-left">Dependency Graph</span>
            {showGraph ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
          {showGraph && (
            <div className="mt-1.5">
              <DependencyGraph />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
