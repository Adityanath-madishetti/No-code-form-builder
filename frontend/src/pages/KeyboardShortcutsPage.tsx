import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function mod(): string {
  if (typeof navigator === 'undefined') return 'Ctrl';
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘' : 'Ctrl';
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="pointer-events-none inline-flex min-h-[1.5rem] min-w-[1.75rem] select-none items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

function ShortcutTable({
  title,
  rows,
}: {
  title: string;
  rows: { action: string; keys: ReactNode }[];
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-foreground">
        {title}
      </h2>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Action
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Shortcut
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.action}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-2.5 text-foreground">{row.action}</td>
                <td className="px-4 py-2.5">
                  <span className="flex flex-wrap items-center gap-1">{row.keys}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const M = mod();

export default function KeyboardShortcutsPage() {
  useEffect(() => {
    document.title = 'Keyboard shortcuts — Form Builder';
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-border bg-background px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Dashboard
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">Keyboard shortcuts</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <p className="mb-8 text-sm text-muted-foreground">
          Shortcuts use <Kbd>{M}</Kbd> on Windows and Linux and <Kbd>⌘</Kbd> on
          macOS. This reference matches the form builder editor. Custom shortcut
          editing will be available here in a future update.
        </p>

        <ShortcutTable
          title="Basic actions"
          rows={[
            {
              action: 'Save form',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>S</Kbd>
                </>
              ),
            },
            {
              action: 'Undo',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>Z</Kbd>
                </>
              ),
            },
            {
              action: 'Redo',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>⇧</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>Z</Kbd>
                  <span className="mx-1 text-xs text-muted-foreground">or</span>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>Y</Kbd>
                  <span className="ml-1 text-xs text-muted-foreground">
                    (Windows)
                  </span>
                </>
              ),
            },
            {
              action: 'Copy component',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>C</Kbd>
                </>
              ),
            },
            {
              action: 'Paste component',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>V</Kbd>
                </>
              ),
            },
          ]}
        />

        <ShortcutTable
          title="Navigation (canvas, when working with components)"
          rows={[
            {
              action: 'Select next component',
              keys: <Kbd>↓</Kbd>,
            },
            {
              action: 'Select previous component',
              keys: <Kbd>↑</Kbd>,
            },
            {
              action: 'Move component down',
              keys: (
                <>
                  <Kbd>⇧</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>↓</Kbd>
                </>
              ),
            },
            {
              action: 'Move component up',
              keys: (
                <>
                  <Kbd>⇧</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>↑</Kbd>
                </>
              ),
            },
            {
              action: 'Open the properties panel (when a component is selected)',
              keys: <Kbd>Enter</Kbd>,
            },
            {
              action: 'Exit the properties panel',
              keys: <Kbd>Esc</Kbd>,
            },
          ]}
        />

        <ShortcutTable
          title="Component interaction (canvas)"
          rows={[
            {
              action: 'Collapse component',
              keys: <Kbd>←</Kbd>,
            },
            {
              action: 'Expand component',
              keys: <Kbd>→</Kbd>,
            },
            {
              action: 'Toggle collapse',
              keys: <Kbd>Space</Kbd>,
            },
            {
              action: 'Open settings / properties panel',
              keys: <Kbd>E</Kbd>,
            },
            {
              action: 'Duplicate component',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>D</Kbd>
                </>
              ),
            },
            {
              action: 'Delete component',
              keys: <Kbd>Delete</Kbd>,
            },
          ]}
        />

        <ShortcutTable
          title="Editor switching"
          rows={[
            {
              action: 'Form builder (canvas)',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>1</Kbd>
                </>
              ),
            },
            {
              action: 'Form properties',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>2</Kbd>
                </>
              ),
            },
            {
              action: 'Logic',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>3</Kbd>
                </>
              ),
            },
            {
              action: 'Workflow',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>4</Kbd>
                </>
              ),
            },
          ]}
        />

        <ShortcutTable
          title="Sidebar controls"
          rows={[
            {
              action: 'Toggle sidebar',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>B</Kbd>
                </>
              ),
            },
            {
              action: 'Focus sidebar search (Components panel)',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>F</Kbd>
                </>
              ),
            },
            {
              action: 'Open Components',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>⇧</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>C</Kbd>
                </>
              ),
            },
            {
              action: 'Open Templates',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>⇧</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>T</Kbd>
                </>
              ),
            },
            {
              action: 'Open Theme',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>⇧</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>M</Kbd>
                </>
              ),
            },
            {
              action: 'Open Logic',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>⇧</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>L</Kbd>
                </>
              ),
            },
            {
              action: 'Open Workflows',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>⇧</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>W</Kbd>
                </>
              ),
            },
            {
              action: 'Open AI Assistant',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>L</Kbd>
                </>
              ),
            },
          ]}
        />

        <ShortcutTable
          title="Other"
          rows={[
            {
              action: 'Preview form',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>⇧</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>E</Kbd>
                </>
              ),
            },
            {
              action: 'Toggle debug panel',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>Alt</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>D</Kbd>
                </>
              ),
            },
            {
              action: 'Previous / next form page (multi-page)',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>[</Kbd>
                  <span className="text-muted-foreground"> / </span>
                  <Kbd>]</Kbd>
                  <span className="mx-1 text-xs text-muted-foreground">or</span>
                  <Kbd>Alt</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>←</Kbd>
                  <span className="text-muted-foreground"> / </span>
                  <Kbd>→</Kbd>
                </>
              ),
            },
            {
              action: 'Open this shortcuts reference (editor)',
              keys: (
                <>
                  <Kbd>{M}</Kbd>
                  <span className="text-muted-foreground">+</span>
                  <Kbd>/</Kbd>
                </>
              ),
            },
          ]}
        />
      </main>
    </div>
  );
}
