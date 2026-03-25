// src/form/components/ComponentCatalogPanel.tsx
import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { catalogRegistry } from '@/form/registry/componentRegistry';
import { useFormStore } from '@/form/store/formStore';

import { DRAG_CATALOG_PAGE_ID, DRAG_CATALOG_COMPONENT_ID } from '@/form/utils/DndUtils';

const STRUCTURE_ITEMS = [
  {
    id: DRAG_CATALOG_PAGE_ID,
    type: DRAG_CATALOG_PAGE_ID,
    label: 'New Page',
    description: 'Add a new blank page to your form.',
  },
];

function DraggableCatalogItem({
  id,
  data,
  label,
  description,
}: {
  id: string;
  data: unknown;
  label: string;
  description: string;
}) {
  const { ref, isDragging } = useDraggable({
    id: id,
    type: (data as Record<string, unknown>).type as string,
    data: data as Record<string, unknown> | undefined,
  });

  return (
    <div className="relative w-full">
      {/* The replica */}
      <div
        className={`flex w-full flex-col items-start rounded-md border bg-muted p-3 text-muted-foreground transition-opacity duration-200 ${isDragging ? 'border-dashed opacity-50' : 'opacity-0'} `}
      >
        <span className="text-sm font-semibold">{label}</span>
        <span className="mt-0.5 line-clamp-2 text-xs font-normal">
          {description}
        </span>
      </div>

      {/* The draggable */}
      <div
        ref={ref}
        className={`absolute top-0 left-0 flex h-full w-full cursor-grab touch-none flex-col items-start rounded-md border border-1 bg-card p-3 text-card-foreground hover:border-primary ${isDragging ? 'z-50 opacity-95' : 'z-10'} `}
      >
        <span className="text-sm font-semibold">{label}</span>
        <span className="mt-0.5 line-clamp-2 text-xs font-normal text-muted-foreground">
          {description}
        </span>
      </div>
    </div>
  );
}

export function ComponentCatalogPanel() {
  const catalogRefreshKey = useFormStore((s) => s.catalogRefreshKey);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredStructure = useMemo(() => {
    if (!searchQuery) return STRUCTURE_ITEMS;
    const lowerQuery = searchQuery.toLowerCase();
    return STRUCTURE_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  const filteredComponents = useMemo(() => {
    if (!searchQuery) return catalogRegistry;
    const lowerQuery = searchQuery.toLowerCase();
    return catalogRegistry.filter(
      (entry) =>
        entry.label.toLowerCase().includes(lowerQuery) ||
        entry.description.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  return (
    <div key={catalogRefreshKey} className="flex flex-col gap-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute top-2 left-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search components..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Handle case where nothing matches */}
      {filteredStructure.length === 0 && filteredComponents.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No components found for "{searchQuery}"
        </div>
      )}

      {/* Structure section */}
      {filteredStructure.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Structure
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {filteredStructure.map((item) => (
              <DraggableCatalogItem
                key={item.id}
                id={item.id}
                data={{ type: item.type }}
                label={item.label}
                description={item.description}
              />
            ))}
          </div>
        </div>
      )}

      {/* components section */}
      {filteredComponents.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Form Fields
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {filteredComponents.map((entry) => (
              <DraggableCatalogItem
                key={entry.id}
                id={`catalog-${entry.id}`}
                data={{
                  type: DRAG_CATALOG_COMPONENT_ID,
                  entry: entry,
                }}
                label={entry.label}
                description={entry.description}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
