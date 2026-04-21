import { Search, LayoutGrid, List as ListIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { LayoutMode } from '../dashboard.types';

interface FormFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  placeholder?: string;
  filterDropdowns?: React.ReactNode;
  layout: LayoutMode;
  onLayoutChange: (l: LayoutMode) => void;
}

export function FormFilters({
  query,
  onQueryChange,
  placeholder = 'Search...',
  filterDropdowns,
  layout,
  onLayoutChange,
}: FormFiltersProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="bg-background pl-9"
        />
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        {filterDropdowns}

        <div className="ml-auto flex items-center rounded-md border bg-background p-0.5 sm:ml-2">
          <Button
            variant={layout === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onLayoutChange('grid')}
            className="h-[26px] w-[26px]"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={layout === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onLayoutChange('list')}
            className="h-[26px] w-[26px]"
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
