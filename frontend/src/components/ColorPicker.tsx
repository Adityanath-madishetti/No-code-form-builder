import { HexColorPicker } from 'react-colorful';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paintbrush } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex w-full items-center gap-2">
            {value ? (
              <div
                className="h-4 w-4 rounded border border-border transition-all"
                style={{ backgroundColor: value }}
              />
            ) : (
              <Paintbrush className="h-4 w-4" />
            )}
            <div className="flex-1 truncate">
              {value ? value : 'Pick a color'}
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex flex-col gap-4">
          <HexColorPicker
            color={value}
            onChange={onChange}
            style={{ width: '100%', height: '180px' }}
          />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="h-8 uppercase"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
