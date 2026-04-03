import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnyFormComponent } from '../registry/componentRegistry';

export interface Group {
  id: string;
  name: string;
  components: AnyFormComponent[];
}

interface GroupStore {
  groups: Group[];
  addGroup: (name: string, components: AnyFormComponent[]) => void;
  removeGroup: (id: string) => void;
}

// TODO: probably need to fetch the user's groups from the database

export const useGroupStore = create<GroupStore>()(
  persist(
    (set) => ({
      groups: [],
      addGroup: (name, components) =>
        set((state) => {
          const newGroup: Group = {
            id: `group-${crypto.randomUUID()}`,
            name,
            components: JSON.parse(JSON.stringify(components)), // Deep clone exactly what we are saving
          };
          return { groups: [...state.groups, newGroup] };
        }),
      removeGroup: (id) =>
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== id),
        })),
    }),
    {
      name: 'form-builder-groups', // localStorage key
    }
  )
);
