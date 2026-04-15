// src/pages/FormEditor/components/ComponentCatalogPanel.tsx
import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/react';
import {
  Search,
  // Layout icons
  Heading,
  Minus,
  SeparatorHorizontal,
  Columns2,
  // Text input icons
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Link,
  // Date / Time
  Calendar,
  Clock,
  // File / Media
  Upload,
  Image,
  // Selection
  CircleDot,
  CheckSquare,
  ChevronDown,
  Grid3X3,
  Table,
  // Scales
  Star,
  Gauge,
  SlidersHorizontal,
  // Blocks
  MapPin,
  User,
  // Specialty
  Palette,
  PenTool,
  Lock,
  ToggleLeft,
  FileText,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { catalogRegistry } from '@/form/registry/componentRegistry';
import { useFormStore } from '@/form/store/form.store';
import { DRAG_CATALOG_COMPONENT_ID } from '@/form/utils/DndUtils';

// Icons mapped to component IDs
const COMPONENT_ICONS: Record<string, React.ElementType> = {
  // Layout
  Header: Heading,
  SectionDivider: SeparatorHorizontal,
  LineDivider: Minus,
  ColumnLayout: Columns2,
  // Existing
  Textbox: AlignLeft,
  Input: Type,
  Radio: CircleDot,
  Checkbox: CheckSquare,
  Dropdown: ChevronDown,
  // Text
  MultiLineText: AlignLeft,
  Email: Mail,
  Phone: Phone,
  Number: Hash,
  Decimal: Hash,
  URL: Link,
  // Date / Time
  Date: Calendar,
  Time: Clock,
  // File
  FileUpload: Upload,
  ImageUpload: Image,
  // Grids
  SingleChoiceGrid: Grid3X3,
  MultiChoiceGrid: Grid3X3,
  MatrixTable: Table,
  // Scales
  RatingScale: Star,
  LinearScale: Gauge,
  Slider: SlidersHorizontal,
  // Blocks
  AddressBlock: MapPin,
  NameBlock: User,
  // Specialty
  ColorPicker: Palette,
  Signature: PenTool,
  Location: MapPin,
  PasswordInput: Lock,
  Toggle: ToggleLeft,
  RichTextInput: FileText,
  Payment: CreditCard,
  Captcha: ShieldCheck,
};

// Category ordering
const CATEGORY_ORDER = [
  'Layout',
  'Text Inputs',
  'Selection',
  'Date & Time',
  'File / Media',
  'Grids & Tables',
  'Scales & Sliders',
  'Blocks',
  'Specialty',
];

function DraggableCatalogItem({
  id,
  data,
  // label,
  description,
  icon: Icon,
}: {
  id: string;
  data: unknown;
  // label: string;
  description: string;
  icon?: React.ElementType;
}) {
  const { ref, isDragging } = useDraggable({
    id,
    type: (data as Record<string, unknown>).type as string,
    data: data as Record<string, unknown> | undefined,
  });

  const IconComp = Icon ?? Type;

  return (
    <div className="relative w-full">
      {/* Ghost */}
      <div
        className={`flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-md border p-2 text-center transition-opacity ${
          isDragging ? 'border-dashed opacity-40' : 'opacity-0'
        }`}
      >
        <div className="flex aspect-square w-[35%] shrink-0 items-center justify-center bg-muted">
          <IconComp className="h-[60%] w-[60%] text-muted-foreground" />
        </div>
        <span className="line-clamp-2 w-full text-[10px] leading-tight font-medium break-words">
          {id}
        </span>
      </div>

      {/* Draggable */}
      <div
        ref={ref}
        className={`absolute top-0 left-0 flex aspect-square h-full w-full cursor-grab touch-none flex-col items-center justify-center gap-1.5 rounded-md border bg-card p-2 text-center text-card-foreground transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm active:cursor-grabbing ${
          isDragging ? 'z-50 opacity-95' : 'z-10'
        }`}
        title={description}
      >
        <div className="flex aspect-square w-[35%] shrink-0 items-center justify-center bg-muted/60">
          <IconComp className="h-[60%] w-[60%] text-primary/80" />
        </div>
        <span className="line-clamp-2 w-full text-[10px] leading-tight font-medium break-words text-foreground/80">
          {id}
        </span>
      </div>
    </div>
  );
}

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

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filteredComponents>();
    for (const entry of filteredComponents) {
      const cat = entry.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(entry);
    }
    // Sort by CATEGORY_ORDER
    const sorted: [string, typeof filteredComponents][] = [];
    for (const cat of CATEGORY_ORDER) {
      if (map.has(cat)) sorted.push([cat, map.get(cat)!]);
    }
    // Any remaining categories not in CATEGORY_ORDER
    for (const [cat, entries] of map) {
      if (!CATEGORY_ORDER.includes(cat)) sorted.push([cat, entries]);
    }
    return sorted;
  }, [filteredComponents]);

  return (
    <div key={catalogRefreshKey} className="flex flex-col gap-4 p-4">
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
          No components found for "{searchQuery}"
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
                id={`${entry.id}`}
                data={{ type: DRAG_CATALOG_COMPONENT_ID, entry }}
                // label={entry.label}
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
