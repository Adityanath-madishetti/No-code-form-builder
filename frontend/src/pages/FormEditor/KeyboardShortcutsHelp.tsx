import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Keyboard } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

function modLabel(): string {
  if (typeof navigator === 'undefined') return 'Ctrl';
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘' : 'Ctrl';
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="pointer-events-none inline-flex h-5 min-w-[1.25rem] select-none items-center justify-center rounded border border-border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

function Row({ keys, label }: { keys: ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex flex-shrink-0 flex-wrap items-center justify-end gap-0.5">
        {keys}
      </span>
    </div>
  );
}

const MOD = modLabel();

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
}: KeyboardShortcutsHelpProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Keyboard shortcuts (Ctrl+/ or ⌘/)"
          className="flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground transition-colors"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3" sideOffset={8}>
        <p className="mb-2 text-xs font-semibold text-foreground">
          Keyboard shortcuts
        </p>
        <div className="divide-y divide-border border-t border-border">
          <Row
            label="Save / Undo / Redo"
            keys={
              <>
                <Kbd>{MOD}</Kbd>
                <Kbd>S</Kbd>
                <span className="mx-0.5 text-muted-foreground">·</span>
                <Kbd>{MOD}</Kbd>
                <Kbd>Z</Kbd>
                <span className="mx-0.5 text-muted-foreground">·</span>
                <Kbd>{MOD}</Kbd>
                <Kbd>⇧</Kbd>
                <Kbd>Z</Kbd>
              </>
            }
          />
          <Row
            label="Copy / paste component"
            keys={
              <>
                <Kbd>{MOD}</Kbd>
                <Kbd>C</Kbd>
                <span className="mx-0.5 text-muted-foreground">·</span>
                <Kbd>{MOD}</Kbd>
                <Kbd>V</Kbd>
              </>
            }
          />
          <Row
            label="Select ↑↓ / move ⇧↑⇧↓"
            keys={
              <>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <span className="mx-0.5 text-muted-foreground">·</span>
                <Kbd>⇧</Kbd>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
              </>
            }
          />
          <Row
            label="Builder / Properties / Logic / Workflow"
            keys={
              <>
                <Kbd>{MOD}</Kbd>
                <Kbd>1</Kbd>
                <span className="text-muted-foreground">–</span>
                <Kbd>4</Kbd>
              </>
            }
          />
          <Row
            label="Sidebar & AI"
            keys={
              <>
                <Kbd>{MOD}</Kbd>
                <Kbd>B</Kbd>
                <span className="mx-0.5 text-muted-foreground">·</span>
                <Kbd>{MOD}</Kbd>
                <Kbd>F</Kbd>
                <span className="mx-0.5 text-muted-foreground">·</span>
                <Kbd>{MOD}</Kbd>
                <Kbd>L</Kbd>
              </>
            }
          />
        </div>
        <Link
          to="/keyboard-shortcuts"
          className="mt-3 block text-center text-xs font-medium text-primary underline-offset-4 hover:underline"
          onClick={() => onOpenChange(false)}
        >
          Full reference
        </Link>
      </PopoverContent>
    </Popover>
  );
}
