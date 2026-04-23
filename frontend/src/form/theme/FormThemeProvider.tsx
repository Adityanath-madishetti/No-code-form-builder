// src/form/theme/FormThemeProvider.tsx
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { formThemeColors, formThemeModes } from './formTheme';
import type {
  FormTheme,
  FormThemeBackground,
  FormThemeLayout,
  FormThemeComponentProps,
} from '@/form/components/base';

// ── Helpers to generate inline styles from theme config ──

function backgroundStyles(bg?: FormThemeBackground): React.CSSProperties {
  if (!bg) return {};
  const s: React.CSSProperties & Record<string, string | number | undefined> =
    {};

  switch (bg.type) {
    case 'solid':
      if (bg.solidColor) s.backgroundColor = bg.solidColor;
      break;
    case 'gradient':
      if (bg.gradient) {
        s.background = `linear-gradient(${bg.gradient.angle}deg, ${bg.gradient.from}, ${bg.gradient.to})`;
      }
      break;
    case 'image':
      if (bg.imageUrl) {
        s.backgroundImage = `url(${bg.imageUrl})`;
        s.backgroundSize = 'cover';
        s.backgroundPosition = 'center';
      }
      break;
    case 'mesh':
      if (bg.mesh?.colors) {
        bg.mesh.colors.forEach((c, i) => {
          s[`--mesh-c${i + 1}`] = c;
        });
      }
      break;
    case 'pattern':
      // Patterns are handled via CSS classes
      break;
  }

  if (bg.fixed) {
    s.backgroundAttachment = 'fixed';
  }

  return s;
}

function patternClass(bg?: FormThemeBackground): string {
  if (!bg || bg.type !== 'pattern' || !bg.pattern) return '';
  return `form-bg-pattern-${bg.pattern}`;
}

function layoutClasses(layout?: FormThemeLayout): string {
  if (!layout) return '';
  const parts: string[] = [];

  // Card style
  if (layout.cardStyle === 'glassmorphism') parts.push('form-card-glass');
  else if (layout.cardStyle === 'elevated') parts.push('form-card-elevated');
  else parts.push('form-card-flat');

  // Spacing
  if (layout.spacing === 'compact') parts.push('form-spacing-compact');
  else if (layout.spacing === 'spacious') parts.push('form-spacing-spacious');
  else parts.push('form-spacing-comfortable');

  return parts.join(' ');
}

function componentClasses(cp?: FormThemeComponentProps): string {
  if (!cp) return '';
  const parts: string[] = [];
  if (cp.shadow !== 'none') parts.push(`form-shadow-${cp.shadow}`);
  if (cp.borderRadius !== 'none') parts.push(`form-radius-${cp.borderRadius}`);
  if (cp.borderWidth !== '0') parts.push(`form-border-${cp.borderWidth}`);
  if (cp.buttonStyle) parts.push(`btn-style-${cp.buttonStyle}`);
  if (cp.inputStyle) parts.push(`input-style-${cp.inputStyle}`);
  return parts.join(' ');
}

function widthStyle(layout?: FormThemeLayout): React.CSSProperties {
  if (!layout) return {};
  if (layout.formWidth === 'full') return { maxWidth: '100%' };
  return { maxWidth: layout.formWidth };
}

/**
 * Merges a page-level theme override with the global theme.
 * Page overrides win; nested objects are shallow-merged.
 */
function mergeThemes(
  global: FormTheme | null,
  pageOverride?: Partial<FormTheme>
): FormTheme | null {
  if (!global) return global;
  if (!pageOverride) return global;

  return {
    ...global,
    ...pageOverride,
    background: pageOverride.background
      ? { ...global.background, ...pageOverride.background }
      : global.background,
    layout: pageOverride.layout
      ? { ...global.layout, ...pageOverride.layout }
      : global.layout,
    componentProps: pageOverride.componentProps
      ? { ...global.componentProps, ...pageOverride.componentProps }
      : global.componentProps,
    headingFont: pageOverride.headingFont ?? global.headingFont,
    bodyFont: pageOverride.bodyFont ?? global.bodyFont,
  } as FormTheme;
}

interface FormThemeProviderProps {
  children: ReactNode;
  globalTheme: FormTheme | null;
  /** Optional page-level overrides pre-merged externally */
  pageOverrides?: Partial<FormTheme>;
}

export function FormThemeProvider({
  children,
  globalTheme,
  pageOverrides,
}: FormThemeProviderProps) {
  // const globalTheme = useFormStore(formSelectors.formTheme);

  // Compute final theme atomically — no flash
  const theme = useMemo(
    () => mergeThemes(globalTheme, pageOverrides),
    [globalTheme, pageOverrides]
  );

  const color = theme?.color || formThemeColors.Default;
  const mode = theme?.mode || formThemeModes.Light;

  const bgStyle = useMemo(
    () => backgroundStyles(theme?.background),
    [theme?.background]
  );
  const wStyle = useMemo(() => widthStyle(theme?.layout), [theme?.layout]);
  const patCls = patternClass(theme?.background);
  const layoutCls = layoutClasses(theme?.layout);
  const compCls = componentClasses(theme?.componentProps);
  const isAnimated = theme?.background?.animated;
  const isMesh = theme?.background?.type === 'mesh';

  const fontVars = useMemo<React.CSSProperties>(() => {
    const vars: Record<string, string> = {};
    if (theme?.headingFont?.family) {
      const familyName = theme.headingFont.family
        .toLowerCase()
        .replace(/\s+/g, '-');
      vars['--form-font-heading'] = `var(--font-${familyName})`;
    }
    if (theme?.bodyFont?.family) {
      const familyName = theme.bodyFont.family
        .toLowerCase()
        .replace(/\s+/g, '-');
      vars['--form-font-body'] = `var(--font-${familyName})`;
    }
    return vars as React.CSSProperties;
  }, [theme]);

  const overlayStyle = useMemo<React.CSSProperties>(() => {
    if (!theme?.background?.overlayOpacity) return {};
    return {
      position: 'absolute' as const,
      inset: 0,
      backgroundColor:
        mode === 'dark'
          ? `rgba(0,0,0,${theme.background.overlayOpacity / 100})`
          : `rgba(255,255,255,${theme.background.overlayOpacity / 100})`,
      pointerEvents: 'none' as const,
    };
  }, [theme, mode]);

  const blurStyle = useMemo<React.CSSProperties>(() => {
    if (!theme?.background?.blur) return {};
    return { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' };
  }, [theme]);

  const customColorVars = useMemo<React.CSSProperties>(() => {
    const vars: Record<string, string> = {};
    if (theme?.primaryColor) {
      const pc = theme.primaryColor;
      vars['--form-primary'] = pc;
      vars['--foreground'] = pc;
      vars['--card-foreground'] = pc;
      vars['--popover-foreground'] = pc;
      vars['--primary'] = pc;
      vars['--primary-foreground'] = 'white'; // Default to white for primary actions
      vars['--ring'] = pc;
      vars['--muted-foreground'] = `color-mix(in srgb, ${pc}, transparent 40%)`;
      vars['--accent-foreground'] = pc;
    }
    if (theme?.secondaryColor) {
      const sc = theme.secondaryColor;
      vars['--form-secondary'] = sc;
      vars['--card'] = sc;
      vars['--popover'] = sc;
      vars['--muted'] = `color-mix(in srgb, ${sc}, var(--foreground) 5%)`;
      vars['--input'] = sc;
      vars['--secondary'] = sc;
      vars['--secondary-foreground'] = 'var(--foreground)';
      vars['--border'] = `color-mix(in srgb, ${sc}, var(--foreground) 15%)`;
      vars['--surface'] = sc;
      vars['--field-background'] = sc;
    }
    return vars as React.CSSProperties;
  }, [theme]);

  return (
    <div
      className={[
        `form-theme-${color}`,
        mode === 'light' ? 'light' : 'dark',
        patCls,
        layoutCls,
        compCls,
        isMesh ? 'form-bg-mesh' : '',
        isAnimated ? 'form-bg-animated' : '',
        'form-theme-container',
        'min-h-[100dvh]',
        'h-fit',
        'flex',
        'flex-col',
        'shrink-0',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...bgStyle,
        ...customColorVars,
        ...fontVars,
        position: 'relative',
      }}
      data-form-width={theme?.layout?.formWidth ?? '800px'}
    >
      {/* Overlay + blur layers */}
      {(theme?.background?.overlayOpacity || theme?.background?.blur) && (
        <div style={{ ...overlayStyle, ...blurStyle }} />
      )}
      {/* Width constraint container */}
      <div style={wStyle} className="form-width-container flex-1">
        {children}
      </div>
    </div>
  );
}
