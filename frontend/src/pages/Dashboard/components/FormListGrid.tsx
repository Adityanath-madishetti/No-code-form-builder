import { FileText, Inbox, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { LayoutMode } from '../dashboard.types';

const LIST_COLUMNS_GRID =
  'grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_120px]';

export interface FormItemData {
  id: string;
  title: string;
  creatorLabel: string;
  updatedAtString: string;
  submissionCount?: number;
  badgeNode: React.ReactNode;
  canEdit: boolean;
  canDelete: boolean; // false for shared tabs
  // Handlers
  onClickTitle: () => void;
  onClickEdit?: () => void; // Usually same as Edit Form/Title
  onClickInbox: () => void;
  onClickPreview: () => void;
  onClickRename: () => void;
  onClickDelete?: () => void;
}

interface FormListGridProps {
  items: FormItemData[];
  layout: LayoutMode;
  emptyIcon?: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  listBadgeHeader: string; // "Status" or "Role"
}

export function FormListGrid({
  items,
  layout,
  emptyIcon = <FileText className="h-8 w-8 text-muted-foreground" />,
  emptyTitle,
  emptyDescription,
  listBadgeHeader,
}: FormListGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-background/50 py-24 text-center">
        <div className="mb-4 rounded-full bg-muted p-3">{emptyIcon}</div>
        <h3 className="text-lg font-medium text-foreground">{emptyTitle}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  if (layout === 'grid') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card
            key={item.id}
            className="group flex flex-col transition-colors hover:border-primary/50"
          >
            <CardHeader className="px-4">
              <div className="flex w-full min-w-0 items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle
                    className="truncate text-base font-semibold hover:cursor-pointer"
                    onClick={item.onClickTitle}
                  >
                    {item.title}
                  </CardTitle>
                  <CardDescription className="mt-1.5 truncate text-xs">
                    {item.creatorLabel}
                  </CardDescription>
                </div>
                {item.badgeNode}
              </div>
            </CardHeader>
            <CardContent className="mt-auto px-4 pt-0 text-xs text-muted-foreground">
              Edited {item.updatedAtString}
              {item.submissionCount !== undefined && (
                <p className="mt-1">
                  {item.submissionCount} submission
                  {item.submissionCount === 1 ? '' : 's'}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-1 border-t bg-muted/20 p-1">
              <div className="flex items-center justify-end gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={item.onClickInbox}
                    >
                      <Inbox className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Submissions</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={item.onClickPreview}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Preview Form</p>
                  </TooltipContent>
                </Tooltip>

                {item.canEdit && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={item.onClickRename}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Rename Form</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {item.canDelete && item.onClickDelete && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={item.onClickDelete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete Form</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // list view
  return (
    <Card className="overflow-hidden p-0">
      <div
        className={`grid ${LIST_COLUMNS_GRID} border-b bg-muted/50 px-4 py-3 text-xs font-medium tracking-wider text-muted-foreground uppercase`}
      >
        <span>Form Name</span>
        <span>Creator</span>
        <span>Last Edited</span>
        <span>{listBadgeHeader}</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="divide-y">
        {items.map((item) => (
          <div
            key={item.id}
            className={`grid ${LIST_COLUMNS_GRID} items-center gap-4 px-4 py-2 transition-colors hover:bg-muted/30`}
          >
            <button
              onClick={item.onClickTitle}
              className="truncate text-left text-sm font-medium hover:underline focus:outline-none"
            >
              {item.title}
            </button>
            <span className="truncate text-sm text-muted-foreground">
              {item.creatorLabel}
            </span>
            <span className="text-sm text-muted-foreground">
              {item.updatedAtString}
            </span>
            <div>{item.badgeNode}</div>

            <div className="flex items-center justify-end gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={item.onClickInbox}
              >
                <Inbox className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={item.onClickPreview}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              {item.canEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={item.onClickRename}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {item.canDelete && item.onClickDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={item.onClickDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
