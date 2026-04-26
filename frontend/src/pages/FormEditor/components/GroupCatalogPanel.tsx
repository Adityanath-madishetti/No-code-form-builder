import { useState, useEffect, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/react';
import { useGroupStore } from '@/form/store/group.store';
import type { Group } from '@/form/store/group.store';
import { DRAG_CATALOG_GROUP_ID } from '@/form/utils/DndUtils';
import { Layers, Edit2, Shield, X, Info, Search } from 'lucide-react';
import type { CatalogGroupDragData } from '@/form/store/form.store';
import { EditGroupDialog } from './EditGroupDialog';
import { InfoGroupDialog } from './InfoGroupDialog';
import {
  DeleteGroupDialog,
  DONT_ASK_DELETE_GROUP_KEY,
} from './DeleteGroupDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function GroupItem({
  group,
  onEdit,
  onInfo,
  onDeleteRequest,
}: {
  group: Group;
  onEdit: (g: Group) => void;
  onInfo: (g: Group) => void;
  onDeleteRequest: (g: Group) => void;
}) {
  const { ref, isDragging } = useDraggable({
    id: `catalog-group-${group.id}`,
    type: DRAG_CATALOG_GROUP_ID,
    data: {
      type: DRAG_CATALOG_GROUP_ID,
      group,
    } as CatalogGroupDragData,
  });

  const { user } = useAuth();

  const isOwner = user?.uid === group.createdBy;

  return (
    <div
      ref={ref}
      className={`group relative flex cursor-grab items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50 ${
        isDragging ? 'opacity-50 ring-2 ring-primary' : 'opacity-100'
      }`}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        {isOwner ? (
          <Layers className="h-4 w-4" />
        ) : (
          <Shield
            className="h-4 w-4 text-emerald-500"
            // title="Shared with you"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden text-left">
        <span className="truncate text-sm font-medium text-foreground">
          {group.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {group.components.length} component
          {group.components.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
        {isOwner ? (
          <>
            <button
              className="mr-1 rounded p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(group);
              }}
              title="Edit group"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              className="mr-1 rounded p-1 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRequest(group);
              }}
              title="Remove group"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            className="mr-1 rounded p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onInfo(group);
            }}
            title="Info"
          >
            <Info className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function GroupCatalogPanel() {
  const groups = useGroupStore((state) => state.groups);
  const { loadGroups, updateGroup, removeGroup } = useGroupStore.getState();
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [infoGroup, setInfoGroup] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortType, setSortType] = useState('newest');

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleDeleteRequest = (group: Group) => {
    if (localStorage.getItem(DONT_ASK_DELETE_GROUP_KEY) === 'true') {
      removeGroup(group.id);
    } else {
      setDeletingGroup(group);
    }
  };

  const filteredAndSortedGroups = useMemo(() => {
    let result = [...groups];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(lower));
    }

    if (filterType === 'personal') {
      result = result.filter((g) => g.createdBy === user?.uid);
    } else if (filterType === 'shared') {
      result = result.filter((g) => g.createdBy !== user?.uid);
    }

    if (sortType === 'newest') {
      result = result.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    } else if (sortType === 'oldest') {
      result = result.sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      );
    } else if (sortType === 'name-asc') {
      result = result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortType === 'name-desc') {
      result = result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [groups, searchTerm, filterType, sortType, user?.uid]);

  const personalGroups = filteredAndSortedGroups.filter(
    (g) => g.createdBy === user?.uid
  );
  const sharedGroups = filteredAndSortedGroups.filter(
    (g) => g.createdBy !== user?.uid
  );

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Groups
        </h2>
        <p className="text-xs text-muted-foreground">
          Drag and drop custom grouped components onto your form.
        </p>
      </div>

      <div className="mb-4 space-y-2">
        <div className="relative">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search groups..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-9 w-full focus:ring-1 focus:ring-primary">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="shared">Shared</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortType} onValueChange={setSortType}>
            <SelectTrigger className="h-9 w-full focus:ring-1 focus:ring-primary">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center space-y-2 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
            <Layers className="h-6 w-6 text-muted-foreground/60" />
            <p className="text-sm font-medium text-muted-foreground">
              No groups yet
            </p>
            <p className="text-xs text-muted-foreground/80">
              Select one or more components on the canvas, right-click, and
              group them to save as a quick template.
            </p>
          </div>
        ) : (
          <>
            {(filterType === 'all' || filterType === 'personal') &&
              personalGroups.length > 0 && (
                <div className="space-y-2">
                  <h3 className="border-b pb-1 text-sm font-medium text-muted-foreground">
                    Personal Groups
                  </h3>
                  <div className="grid gap-2">
                    {personalGroups.map((group) => (
                      <GroupItem
                        key={group.id}
                        group={group}
                        onEdit={setEditingGroup}
                        onInfo={setInfoGroup}
                        onDeleteRequest={handleDeleteRequest}
                      />
                    ))}
                  </div>
                </div>
              )}

            {(filterType === 'all' || filterType === 'shared') &&
              sharedGroups.length > 0 && (
                <div className="space-y-2">
                  <h3 className="border-b pb-1 text-sm font-medium text-muted-foreground">
                    Shared with you
                  </h3>
                  <div className="grid gap-2">
                    {sharedGroups.map((group) => (
                      <GroupItem
                        key={group.id}
                        group={group}
                        onEdit={setEditingGroup}
                        onInfo={setInfoGroup}
                        onDeleteRequest={handleDeleteRequest}
                      />
                    ))}
                  </div>
                </div>
              )}
          </>
        )}
      </div>

      {editingGroup && (
        <EditGroupDialog
          group={editingGroup}
          open={!!editingGroup}
          onOpenChange={(open) => !open && setEditingGroup(null)}
          onSave={updateGroup}
        />
      )}

      {infoGroup && (
        <InfoGroupDialog
          group={infoGroup}
          open={!!infoGroup}
          onOpenChange={(open) => !open && setInfoGroup(null)}
        />
      )}

      {deletingGroup && (
        <DeleteGroupDialog
          open={!!deletingGroup}
          onOpenChange={(open) => !open && setDeletingGroup(null)}
          onConfirm={() => removeGroup(deletingGroup.id)}
          groupName={deletingGroup.name}
        />
      )}
    </div>
  );
}
