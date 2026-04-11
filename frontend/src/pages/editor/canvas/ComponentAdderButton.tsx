// src/pages/editor/canvas/ComponentAdderButton.tsx
import { useState } from 'react';
import type { PageID } from '@/form/components/base';
import { ComponentWindow } from './ComponentCatalogWindow';

interface ComponentAdderButtonProps {
  pageId: PageID;
  insertIndex: number;
}

export function ComponentAdderButton({
  pageId,
  insertIndex,
}: ComponentAdderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="group/adder relative flex items-center justify-center py-3">
      {/* "Add Component" button — always visible */}
      <div className="flex w-full items-center gap-2">
        <div className="h-px flex-1 border-t border-dashed border-border/60" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`shrink-0 rounded-none border px-3 py-1 text-[11px] font-medium transition-all ${
            isOpen
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary'
          }`}
          aria-label="Add component"
        >
          Add Component
        </button>
        <div className="h-px flex-1 border-t border-dashed border-border/60" />
      </div>

      {/* Spotlight popup */}
      {isOpen && (
        <ComponentWindow
          pageId={pageId}
          insertIndex={insertIndex}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
