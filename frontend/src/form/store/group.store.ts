import { create } from 'zustand';
import type { AnyFormComponent } from '../registry/componentRegistry';
import {
  fetchGroups,
  addGroup as apiAddGroup,
  updateGroup as apiUpdateGroup,
  deleteGroup as apiDeleteGroup,
} from '@/lib/groupApi';

export interface Group {
  id: string; // mapped from groupId
  name: string;
  components: AnyFormComponent[];
  createdBy: string;
  sharedWith: string[];
  isPublic: boolean;
  createdAt?: string;
  creatorEmail?: string;
}

interface GroupStore {
  groups: Group[];
  isLoading: boolean;
  error: string | null;
  loadGroups: () => Promise<void>;
  addGroup: (name: string, components: AnyFormComponent[]) => Promise<void>;
  updateGroup: (
    id: string,
    updates: {
      name?: string;
      sharedWith?: string[];
      isPublic?: boolean;
      components?: AnyFormComponent[];
    }
  ) => Promise<void>;
  removeGroup: (id: string) => Promise<void>;
}

export const useGroupStore = create<GroupStore>((set) => ({
  groups: [],
  isLoading: false,
  error: null,
  loadGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const dbGroups = await fetchGroups();
      set({
        groups: dbGroups.map((g) => ({
          ...g,
          id: g.groupId,
        })),
        isLoading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  addGroup: async (name, components) => {
    try {
      const newGroup = await apiAddGroup(name, components);
      set((state) => ({
        groups: [...state.groups, { ...newGroup, id: newGroup.groupId }],
      }));
    } catch (err) {
      console.error(err);
    }
  },
  updateGroup: async (id, updates) => {
    try {
      const updated = await apiUpdateGroup(id, updates);
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === id ? { ...updated, id: updated.groupId } : g
        ),
      }));
    } catch (err) {
      console.error(err);
    }
  },
  removeGroup: async (id) => {
    try {
      await apiDeleteGroup(id);
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
      }));
    } catch (err) {
      console.error(err);
    }
  },
}));
