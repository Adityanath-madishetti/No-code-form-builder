import { Label } from '@/components/ui/label';

export const ComponentPropTitle = ({ title }: { title: string }) => {
  return <Label className="mt-4 mb-1 block text-sm font-medium text-muted-foreground">{title}</Label>;
};
