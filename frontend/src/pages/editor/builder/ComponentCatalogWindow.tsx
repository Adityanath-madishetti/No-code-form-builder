import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import {
  Search,
  Heading,
  Minus,
  AlignLeft,
  Hash,
  CircleDot,
  CheckSquare,
  ChevronDown,
  X,
} from 'lucide-react';

import { MdNotes, MdOutlineShortText } from 'react-icons/md';
import { PiTextbox } from 'react-icons/pi';
import { TbDecimal } from 'react-icons/tb';

import { catalogRegistry } from '@/form/registry/componentRegistry';
import { useFormStore } from '@/form/store/form.store';
import type { PageID } from '@/form/components/base';

/* ── Icon map ── */
export const COMPONENT_ICONS: Record<string, React.ElementType> = {
  Header: Heading,
  Textbox: PiTextbox,
  LineDivider: Minus,
  SingleLineInput: MdOutlineShortText,
  MultiLineInput: MdNotes,
  Number: Hash,
  Decimal: TbDecimal,
  Radio: CircleDot,
  Checkbox: CheckSquare,
  Dropdown: ChevronDown,
};

const CATEGORY_ORDER = ['Layout', 'Text', 'Numeric', 'Selection'];

interface ComponentEntryProps {
  id: string;
  label: string;
  description: string;
  onInsert: (id: string) => void;
}

function ComponentEntry({
  id,
  label,
  description,
  onInsert,
}: ComponentEntryProps) {
  const Icon = COMPONENT_ICONS[id] ?? AlignLeft;

  return (
    <button
      onClick={() => onInsert(id)}
      className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-sm border border-border/50 bg-card p-2 text-center text-card-foreground transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm active:scale-95"
      title={description}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-xs bg-muted/10">
        <Icon className="h-[50%] w-[50%] text-primary/80" />
      </div>
      <span className="w-full text-[10px] leading-tight font-medium whitespace-pre-line text-foreground/80">
        {label}
      </span>
    </button>
  );
}

interface CategoryGroupProps {
  category: string;
  entries: typeof catalogRegistry;
  onInsert: (id: string) => void;
}

function CategoryGroup({ category, entries, onInsert }: CategoryGroupProps) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-1.5 text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">
        {category}
      </p>
      <div className="grid grid-cols-6 gap-2">
        {entries.map((entry) => (
          <ComponentEntry
            key={entry.id}
            id={entry.id}
            label={entry.label}
            description={entry.description}
            onInsert={onInsert}
          />
        ))}
      </div>
    </div>
  );
}

export interface ComponentWindowProps {
  pageId: PageID;
  insertIndex: number;
  onClose: () => void;
}

export function ComponentWindow({
  pageId,
  insertIndex,
  onClose,
}: ComponentWindowProps) {
  const addComponent = useFormStore((s) => s.addComponent);
  const setActiveComponent = useFormStore((s) => s.setActiveComponent);
  const setActivePage = useFormStore((s) => s.setActivePage);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [gridHeight, setGridHeight] = useState<number | null>(null);

  const MIN_GRID_H = 150;
  const MAX_GRID_H = 520;

  // Auto-focus search on open
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredComponents = useMemo(() => {
    if (!searchQuery) return catalogRegistry;
    const q = searchQuery.toLowerCase();
    return catalogRegistry.filter(
      (entry) =>
        entry.label.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filteredComponents>();
    for (const entry of filteredComponents) {
      const cat = entry.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(entry);
    }

    const sorted: [string, typeof filteredComponents][] = [];
    for (const cat of CATEGORY_ORDER) {
      if (map.has(cat)) sorted.push([cat, map.get(cat)!]);
    }
    for (const [cat, entries] of map) {
      if (!CATEGORY_ORDER.includes(cat)) sorted.push([cat, entries]);
    }
    return sorted;
  }, [filteredComponents]);

  // Measure inner content and set animated height
  useLayoutEffect(() => {
    if (!innerRef.current) return;
    // Temporarily remove height constraint to measure natural content height
    const natural = innerRef.current.scrollHeight;
    setGridHeight(Math.max(MIN_GRID_H, Math.min(natural, MAX_GRID_H)));
  }, [grouped]);

  const handleInsert = (entryId: string) => {
    const entry = catalogRegistry.find((e) => e.id === entryId);
    if (!entry) return;

    const instanceId = `${entry.id}-${crypto.randomUUID()}`;
    const component = entry.create(instanceId);
    addComponent(pageId, component, insertIndex);

    // Select the newly inserted component
    setActiveComponent(instanceId);
    setActivePage(null);
    onClose();
  };

  return (
    /* Full-screen overlay to center the spotlight */
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-[15vh] backdrop-blur-[2px]">
      <div
        ref={popoverRef}
        className="w-[600px] animate-in overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl duration-150 fade-in-0 zoom-in-95"
      >
        {/* Search bar */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search components..."
            className="h-7 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            onClick={onClose}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Component grid – animated height wrapper */}
        <div
          style={{
            height: gridHeight != null ? `${gridHeight}px` : 'auto',
            transition: 'height 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
          }}
        >
          <div
            ref={innerRef}
            className="overflow-y-auto p-5"
            style={{ maxHeight: `${MAX_GRID_H}px` }}
          >
            {grouped.length === 0 && (
              <div
                className="flex flex-col items-center justify-center text-muted-foreground"
                style={{ minHeight: `${MIN_GRID_H - 40}px` }}
              >
                <Search className="mb-2 h-8 w-8 opacity-30" />
                <p className="text-sm font-medium">No components found</p>
                <p className="mt-0.5 text-xs opacity-60">
                  No results for &quot;{searchQuery}&quot;
                </p>
              </div>
            )}

            {grouped.map(([category, entries]) => (
              <CategoryGroup
                key={category}
                category={category}
                entries={entries}
                onInsert={handleInsert}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
