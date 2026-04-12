import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { ComponentListPanel } from './ComponentList';
import { ComponentPropertiesPanel } from './ComponentProperties';

interface BuilderSidePanelProps {
  currentPageIndex: number;
}

export function BuilderSidePanel({ currentPageIndex }: BuilderSidePanelProps) {
  const [componentsOpen, setComponentsOpen] = useState(true);
  const [propertiesOpen, setPropertiesOpen] = useState(true);

  const [splitRatio, setSplitRatio] = useState(0.33);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  /* ── Drag-to-resize ── */
  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const y = ev.clientY - rect.top;

      const availableHeight = rect.height - 32 - 6 - 32; // Total minus headers and divider
      const offsetTop = y - 32; // Distance from top of available space
      const ratio = Math.max(0.15, Math.min(0.85, offsetTop / availableHeight));

      setSplitRatio(ratio);
    };

    const stopDragging = () => {
      dragging.current = false;

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('mouseleave', stopDragging);

      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('mouseleave', stopDragging);

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const compFr = componentsOpen ? (propertiesOpen ? splitRatio : 1) : 0;
  const propFr = propertiesOpen ? (componentsOpen ? 1 - splitRatio : 1) : 0;

  return (
    <div
      ref={containerRef}
      className="grid h-full transition-[grid-template-rows] duration-300 ease-in-out"
      style={{
        gridTemplateRows: `32px ${compFr}fr 6px 32px ${propFr}fr`,
      }}
    >
      {/* ── Components Header ── */}
      <button
        onClick={() => setComponentsOpen((p) => !p)}
        className="flex h-8 w-full items-center gap-1.5 px-3 hover:bg-muted/50 focus:outline-none"
      >
        <ChevronRight
          className={`h-3 w-3 transition-transform duration-200 ${
            componentsOpen ? 'rotate-90' : ''
          }`}
        />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
          Components
        </span>
      </button>

      {/* ── Components Body ── */}
      <div
        className={`min-h-0 overflow-hidden transition-opacity duration-300 ${
          componentsOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="h-full overflow-y-auto">
          <ComponentListPanel pageId={null} pageIndex={currentPageIndex} />
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="flex flex-col justify-center">
        {componentsOpen && propertiesOpen ? (
          <div
            onMouseDown={onDividerMouseDown}
            className="group flex h-1.5 w-full shrink-0 cursor-row-resize items-center justify-center border-y border-border bg-muted/30 hover:bg-primary/10 active:bg-primary/20"
          >
            <div className="h-0.5 w-8 rounded-full bg-muted-foreground/20 group-hover:bg-primary/40" />
          </div>
        ) : (
          <div className="h-px w-full bg-border" />
        )}
      </div>

      {/* ── Properties Header ── */}
      <button
        onClick={() => setPropertiesOpen((p) => !p)}
        className="flex h-8 w-full items-center gap-1.5 px-3 hover:bg-muted/50 focus:outline-none"
      >
        <ChevronRight
          className={`h-3 w-3 transition-transform duration-200 ${
            propertiesOpen ? 'rotate-90' : ''
          }`}
        />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
          Properties
        </span>
      </button>

      {/* ── Properties Body ── */}
      <div
        className={`min-h-0 overflow-hidden transition-opacity duration-300 ${
          propertiesOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="h-full overflow-y-auto">
          <ComponentPropertiesPanel />
        </div>
      </div>
    </div>
  );
}
