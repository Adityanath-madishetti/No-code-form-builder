import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/react';

import {
  Search,
  Heading,
  Minus,
  AlignLeft,
  Hash,
  CircleDot,
  CheckSquare,
  ChevronDown,
} from 'lucide-react';

import { MdNotes, MdOutlineShortText } from 'react-icons/md';
import { PiTextbox } from 'react-icons/pi';
import { TbDecimal } from 'react-icons/tb';

import { Input } from '@/components/ui/input';
import { catalogRegistry } from '@/form/registry/componentRegistry';
import { useFormStore } from '@/form/store/form.store';
import { DRAG_CATALOG_COMPONENT_ID } from '@/form/utils/DndUtils';

/** Icons mapped to component IDs */
const COMPONENT_ICONS: Record<string, React.ElementType> = {
  // Layout
  Header: Heading,
  Textbox: PiTextbox,
  LineDivider: Minus,
  // Text
  SingleLineInput: MdOutlineShortText,
  MultiLineInput: MdNotes,
  // Numeric
  Number: Hash,
  Decimal: TbDecimal,
  // Selection
  Radio: CircleDot,
  Checkbox: CheckSquare,
  Dropdown: ChevronDown,
};

/**
 * Category display order.
 * Must match the `category` strings defined in componentRegistry.ts.
 */
const CATEGORY_ORDER = ['Layout', 'Text', 'Numeric', 'Selection'];

/* ─────────────────────────────
   Draggable catalog item
───────────────────────────── */

function DraggableCatalogItem({
  id,
  label,
  data,
  description,
  icon: Icon,
}: {
  id: string;
  label: string;
  data: unknown;
  description: string;
  icon?: React.ElementType;
}) {
  const { ref, isDragging } = useDraggable({
    id,
    type: (data as Record<string, unknown>).type as string,
    data: data as Record<string, unknown> | undefined,
  });

  const IconComp = Icon ?? AlignLeft;
  return (
    <div className="relative w-full">
      {/* Ghost placeholder while dragging */}
      <div
        className={`flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-md border p-2 text-center transition-opacity ${
          isDragging ? 'border-dashed opacity-40' : 'opacity-0'
        }`}
      >
        <div className="flex aspect-square w-[42%] shrink-0 items-center justify-center bg-muted">
          <IconComp className="h-[72%] w-[72%] text-muted-foreground" />
        </div>
        <span className="w-full whitespace-pre-line text-[10px] leading-tight font-medium break-words">
          {label}
        </span>
      </div>

      {/* Actual draggable element */}
      <div
        ref={ref}
        className={`absolute top-0 left-0 flex aspect-square h-full w-full cursor-grab touch-none flex-col items-center justify-center gap-1.5 rounded-sm border bg-card p-2 text-center text-card-foreground transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm active:cursor-grabbing ${
          isDragging ? 'z-50 opacity-95' : 'z-10'
        }`}
        title={description}
      >
        <div className="flex aspect-square w-[42%] shrink-0 items-center justify-center rounded-xs bg-muted/60">
          <IconComp className="h-[65%] w-[65%] text-primary/80" />
        </div>
        <span className="w-full whitespace-pre-line text-[10px] leading-tight font-medium break-words text-foreground/80">
          {label}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────
   Panel
───────────────────────────── */
export function ComponentCatalogPanel() {
  const catalogRefreshKey = useFormStore((s) => s.catalogRefreshKey);
  const [searchQuery, setSearchQuery] = useState('');

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

  /** Group by category, preserving CATEGORY_ORDER */
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filteredComponents>();
    for (const entry of filteredComponents) {
      const cat = entry.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(entry);
    }

    const sorted: [string, typeof filteredComponents][] = [];

    // Add categories in the defined order
    for (const cat of CATEGORY_ORDER) {
      if (map.has(cat)) sorted.push([cat, map.get(cat)!]);
    }

    // Append any remaining categories not listed in CATEGORY_ORDER
    for (const [cat, entries] of map) {
      if (!CATEGORY_ORDER.includes(cat)) sorted.push([cat, entries]);
    }

    return sorted;
  }, [filteredComponents]);

  return (
    <div key={catalogRefreshKey} className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          type="search"
          data-sidebar-search
          placeholder="Search components..."
          className="h-9 pl-8 text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Empty state */}
      {grouped.length === 0 && (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No components found for &quot;{searchQuery}&quot;
        </p>
      )}

      {/* Category groups */}
      {grouped.map(([category, entries]) => (
        <div key={category} className="flex flex-col gap-1.5">
          <p className="mb-0.5 text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">
            {category}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {entries.map((entry) => (
              <DraggableCatalogItem
                key={entry.id}
                id={entry.id}
                label={entry.label}
                data={{ type: DRAG_CATALOG_COMPONENT_ID, entry }}
                description={entry.description}
                icon={COMPONENT_ICONS[entry.id]}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
