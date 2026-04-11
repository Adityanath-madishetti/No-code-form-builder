// src/pages/FormEditor/components/RightFloatingPanel.tsx
import { useCallback, useRef, type ReactNode } from 'react';

interface RightFloatingPanelProps {
  width: number;
  onWidthChange: (w: number) => void;
  minWidth?: number;
  maxWidth?: number;
  zIndex?: number;
  /** Offset from the right edge (e.g. to sit beside another panel) */
  rightOffset?: number;
  children: ReactNode;
}

/**
 * A right-anchored floating panel with a draggable left-edge resize handle.
 * Unlike react-rnd, this uses simple absolute positioning with `right: 0`
 * so it is always pinned to the right side of the page.
 */
export function RightFloatingPanel({
  width,
  onWidthChange,
  minWidth = 250,
  maxWidth = 600,
  zIndex = 40,
  rightOffset = 0,
  children,
}: RightFloatingPanelProps) {
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startWidth.current = width;

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        // Dragging left increases width, dragging right decreases
        const delta = startX.current - ev.clientX;
        const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta));
        onWidthChange(newWidth);
      };

      const onMouseUp = () => {
        dragging.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [width, minWidth, maxWidth, onWidthChange]
  );

  return (
    <div
      className="absolute top-0 bottom-0 right-0 flex flex-col border-l border-border bg-background shadow-2xl"
      style={{ width, zIndex, right: rightOffset }}
    >
      {/* Left-edge resize handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-50"
      />
      {children}
    </div>
  );
}
