// src/pages/FormEditor/components/PageNavigator.tsx
import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface PageNavigatorProps {
  currentPage: number;   // 1-indexed
  totalPages: number;
  onNavigate: (page: number) => void;
  onAddPage: () => void;
}

export function PageNavigator({
  currentPage,
  totalPages,
  onNavigate,
  onAddPage,
}: PageNavigatorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(currentPage));
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep draft in sync when page changes externally
  useEffect(() => {
    setDraft(String(currentPage));
  }, [currentPage]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      onNavigate(n);
    } else {
      setDraft(String(currentPage));
    }
    setEditing(false);
  };

  const startEdit = () => {
    setDraft(String(currentPage));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  return (
    <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex items-center justify-center">
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-border bg-background/90 px-2 py-1.5 shadow-lg backdrop-blur-sm">
        {/* Left arrow */}
        <button
          onClick={() => currentPage > 1 && onNavigate(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page number display / editable */}
        <div className="flex items-center gap-1.5 px-1 text-sm">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') {
                  setDraft(String(currentPage));
                  setEditing(false);
                }
              }}
              className="w-8 rounded border border-primary bg-transparent text-center text-sm font-medium text-foreground outline-none"
            />
          ) : (
            <button
              onClick={startEdit}
              className="min-w-[1.5rem] rounded px-1 text-center font-semibold text-foreground hover:bg-muted"
              title="Click to jump to page"
            >
              {currentPage}
            </button>
          )}
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-muted-foreground">{totalPages}</span>
        </div>

        {/* Right arrow */}
        <button
          onClick={() => currentPage < totalPages && onNavigate(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="mx-0.5 h-5 w-px bg-border" />

        {/* Add page */}
        <button
          onClick={onAddPage}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          aria-label="Add new page"
          title="Add page"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
