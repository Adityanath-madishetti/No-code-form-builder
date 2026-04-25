// backend/src/modules/group/group.types.ts
export interface IGroupBase {
  groupId: string;
  name: string;
  components: any;
  createdBy: string;
  sharedWith: string[];
  isPublic: boolean;
}

export interface GroupResponse extends IGroupBase {
  creatorEmail: string;
  createdAt: Date;
  updatedAt: Date;
}
