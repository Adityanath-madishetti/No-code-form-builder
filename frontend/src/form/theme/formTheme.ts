// src/form/theme/formTheme.ts

export const formFontNames = {
  Inter: 'Inter',
  Roboto: 'Roboto',
  OpenSans: 'Open Sans',
  Lato: 'Lato',
  Montserrat: 'Montserrat',
  SourceSansPro: 'Source Sans Pro',
  Poppins: 'Poppins',
  Raleway: 'Raleway',
  NotoSans: 'Noto Sans',
  Ubuntu: 'Ubuntu',
} as const;
export type formFontName = (typeof formFontNames)[keyof typeof formFontNames];

export const formThemeColors = {
  Default: 'default',
  Red: 'red',
  Orange: 'orange',
  Yellow: 'yellow',
  Green: 'green',
  Blue: 'blue',
  // Indigo: 'indigo',
  Purple: 'purple',
  Pink: 'pink',
  // Gray: 'gray',
} as const;
export type formThemeColor =
  (typeof formThemeColors)[keyof typeof formThemeColors];

export const formThemeModes = {
  Light: 'light',
  Dark: 'dark',
} as const;
export type formThemeMode =
  (typeof formThemeModes)[keyof typeof formThemeModes];

export const DEFAULT_FORM_THEME: {
  color: formThemeColor;
  mode: formThemeMode;
  headingFont: { family: formFontName };
  bodyFont: { family: formFontName };
  background: {
    type: 'solid';
    solidColor: string;
    blur: boolean;
    overlayOpacity: number;
    fixed: boolean;
  };
  layout: {
    formWidth: '600px' | '800px' | 'full';
    cardStyle: 'flat' | 'elevated' | 'glassmorphism';
    spacing: 'compact' | 'comfortable' | 'spacious';
  };
  componentProps: {
    shadow: 'none' | 'sm' | 'md' | 'lg';
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
    borderWidth: '0' | '1' | '2';
  };
} = {
  color: formThemeColors.Default,
  mode: formThemeModes.Light,
  headingFont: { family: formFontNames.Inter },
  bodyFont: { family: formFontNames.Inter },
  background: {
    type: 'solid',
    solidColor: '#ffffff',
    blur: false,
    overlayOpacity: 0,
    fixed: false,
  },
  layout: {
    formWidth: '800px',
    cardStyle: 'elevated',
    spacing: 'comfortable',
  },
  componentProps: {
    shadow: 'sm',
    borderRadius: 'md',
    borderWidth: '1',
  },
};
