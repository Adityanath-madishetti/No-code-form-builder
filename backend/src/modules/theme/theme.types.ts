// backend/src/modules/theme/theme.types.ts

export interface IThemeTemplate {
  themeId: string;
  name: string;
  theme: any;
  createdBy: string;
  sharedWith: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IThemeCreate {
  name: string;
  theme: any;
  sharedWith?: string[];
  isPublic?: boolean;
}

export interface IThemeUpdate {
  name?: string;
  theme?: any;
  sharedWith?: string[];
  isPublic?: boolean;
}

export interface IThemeResponse extends IThemeTemplate {
  creatorEmail: string;
}
