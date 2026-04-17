// src/pages/FormEditor/components/ThemingPage.tsx
import { useCallback, useMemo, useRef } from 'react';
import { useFormStore, formSelectors } from '@/form/store/form.store';
import { useThemeUIStore } from '@/form/theme/theme.store';
import { FormThemeProvider } from '@/form/theme/FormThemeProvider';
import { FormModeProvider } from '@/form/context/FormModeContext';
import { RenderPage } from '@/form/renderer/editRenderer/RenderPage';
import { type formThemeColor } from '@/form/theme/formTheme';
import type {
  FormThemeBackground,
  FormThemeLayout,
  FormThemeComponentProps,
} from '@/form/components/base';
import {
  ChevronDown,
  ChevronRight,
  Palette,
  Image as ImageIcon,
  Layout,
  BoxSelect,
  Upload,
  X,
  Type,
} from 'lucide-react';
import { formFontNames, type formFontName } from '@/form/theme/formTheme';
import type { ThemeSection, BackgroundSubTab } from '@/form/theme/theme.store';

// ── Theme color swatch map ──
const THEME_COLORS: { key: string; color: formThemeColor; bg: string }[] = [
  { key: 'Default', color: 'default', bg: '#525252' },
  { key: 'Red', color: 'red', bg: '#ef4444' },
  { key: 'Orange', color: 'orange', bg: '#f97316' },
  { key: 'Yellow', color: 'yellow', bg: '#eab308' },
  { key: 'Green', color: 'green', bg: '#22c55e' },
  { key: 'Blue', color: 'blue', bg: '#3b82f6' },
  { key: 'Purple', color: 'purple', bg: '#a855f7' },
  { key: 'Pink', color: 'pink', bg: '#ec4899' },
];

const PATTERN_OPTIONS: { id: FormThemeBackground['pattern']; label: string }[] =
  [
    { id: 'dots', label: 'Dots' },
    { id: 'grid', label: 'Grid' },
    { id: 'diagonal', label: 'Lines' },
    { id: 'waves', label: 'Waves' },
    { id: 'noise', label: 'Noise' },
  ];

const SHADOW_OPTIONS: FormThemeComponentProps['shadow'][] = [
  'none',
  'sm',
  'md',
  'lg',
];
const RADIUS_OPTIONS: FormThemeComponentProps['borderRadius'][] = [
  'none',
  'sm',
  'md',
  'lg',
  'full',
];
const BORDER_OPTIONS: FormThemeComponentProps['borderWidth'][] = [
  '0',
  '1',
  '2',
];

// ════════════════════════════════════════════════════════════════
// Section wrapper for collapsible panels
// ════════════════════════════════════════════════════════════════

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: ThemeSection;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  const expanded = useThemeUIStore((s) => s.expandedSections.has(id));
  const toggle = useThemeUIStore((s) => s.toggleSection);

  return (
    <div className="theme-section">
      <button
        className="theme-section-header"
        onClick={() => toggle(id)}
        type="button"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 opacity-60" />
          {title}
        </span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 opacity-40" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
      {expanded && <div className="theme-section-body">{children}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Colors Section
// ════════════════════════════════════════════════════════════════

function ColorsSection() {
  const theme = useFormStore(formSelectors.formTheme);
  const update = useFormStore((s) => s.updateFormTheme);

  // Also check if we're in page override mode
  const activeTab = useThemeUIStore((s) => s.activeTab);
  const selectedPageId = useThemeUIStore((s) => s.selectedPageId);
  const pages = useFormStore((s) => s.pages);
  const updatePageOverrides = useFormStore((s) => s.updatePageThemeOverrides);

  const currentColor = useMemo(() => {
    if (activeTab === 'page' && selectedPageId) {
      return (
        pages[selectedPageId]?.themeOverrides?.color ??
        theme?.color ??
        'default'
      );
    }
    return theme?.color ?? 'default';
  }, [activeTab, selectedPageId, pages, theme?.color]);

  // const currentPrimary = useMemo(() => {
  //   if (activeTab === 'page' && selectedPageId) {
  //     return (
  //       pages[selectedPageId]?.themeOverrides?.primaryColor ??
  //       theme?.primaryColor ??
  //       ''
  //     );
  //   }
  //   return theme?.primaryColor ?? '';
  // }, [activeTab, selectedPageId, pages, theme?.primaryColor]);

  // const currentText = useMemo(() => {
  //   if (activeTab === 'page' && selectedPageId) {
  //     return (
  //       pages[selectedPageId]?.themeOverrides?.textColor ??
  //       theme?.textColor ??
  //       ''
  //     );
  //   }
  //   return theme?.textColor ?? '';
  // }, [activeTab, selectedPageId, pages, theme?.textColor]);

  const setColor = useCallback(
    (color: formThemeColor) => {
      if (activeTab === 'page' && selectedPageId) {
        updatePageOverrides(selectedPageId, { color });
      } else {
        update({ color });
      }
    },
    [activeTab, selectedPageId, update, updatePageOverrides]
  );

  // const setPrimary = useCallback(
  //   (primaryColor: string) => {
  //     if (activeTab === 'page' && selectedPageId) {
  //       updatePageOverrides(selectedPageId, { primaryColor });
  //     } else {
  //       update({ primaryColor });
  //     }
  //   },
  //   [activeTab, selectedPageId, update, updatePageOverrides]
  // );

  // const setTextColor = useCallback(
  //   (textColor: string) => {
  //     if (activeTab === 'page' && selectedPageId) {
  //       updatePageOverrides(selectedPageId, { textColor });
  //     } else {
  //       update({ textColor });
  //     }
  //   },
  //   [activeTab, selectedPageId, update, updatePageOverrides]
  // );

  return (
    <Section id="colors" icon={Palette} title="Colors">
      {/* Theme color presets */}
      <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Theme Color
      </label>
      <div className="theme-color-grid mb-4">
        {THEME_COLORS.map((tc) => (
          <button
            key={tc.key}
            className={`theme-color-swatch ${currentColor === tc.color ? 'active' : ''}`}
            style={{ backgroundColor: tc.bg }}
            onClick={() => setColor(tc.color)}
            title={tc.key}
            type="button"
          >
            {currentColor === tc.color && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full border-2 border-white bg-white/30" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom primary color */}
      {/* <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Custom Primary Color
      </label>
      <div className="mb-3 flex items-center gap-2">
        <input
          type="color"
          value={currentPrimary || '#3b82f6'}
          onChange={(e) => setPrimary(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-border"
        />
        <input
          type="text"
          value={currentPrimary}
          onChange={(e) => setPrimary(e.target.value)}
          placeholder="#3b82f6"
          className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs text-foreground"
        />
        {currentPrimary && (
          <button
            onClick={() => setPrimary('')}
            className="text-muted-foreground hover:text-foreground"
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div> */}

      {/* Text color */}
      {/* <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Text Color
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={currentText || '#1a1a1a'}
          onChange={(e) => setTextColor(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-border"
        />
        <input
          type="text"
          value={currentText}
          onChange={(e) => setTextColor(e.target.value)}
          placeholder="#1a1a1a"
          className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs text-foreground"
        />
        {currentText && (
          <button
            onClick={() => setTextColor('')}
            className="text-muted-foreground hover:text-foreground"
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div> */}
    </Section>
  );
}

// ════════════════════════════════════════════════════════════════
// Background Section
// ════════════════════════════════════════════════════════════════

function BackgroundSection() {
  const theme = useFormStore(formSelectors.formTheme);
  const update = useFormStore((s) => s.updateFormTheme);
  const activeTab = useThemeUIStore((s) => s.activeTab);
  const selectedPageId = useThemeUIStore((s) => s.selectedPageId);
  const pages = useFormStore((s) => s.pages);
  const updatePageOverrides = useFormStore((s) => s.updatePageThemeOverrides);
  const bgSubTab = useThemeUIStore((s) => s.backgroundSubTab);
  const setBgSubTab = useThemeUIStore((s) => s.setBackgroundSubTab);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bg: FormThemeBackground = useMemo(() => {
    const globalBg = theme?.background ?? { type: 'solid' as const };
    if (activeTab === 'page' && selectedPageId) {
      const pageOverrides = pages[selectedPageId]?.themeOverrides?.background;
      return pageOverrides ? { ...globalBg, ...pageOverrides } : globalBg;
    }
    return globalBg;
  }, [activeTab, selectedPageId, pages, theme?.background]);

  const setBg = useCallback(
    (partial: Partial<FormThemeBackground>) => {
      const newBg = { ...bg, ...partial };
      if (activeTab === 'page' && selectedPageId) {
        updatePageOverrides(selectedPageId, { background: newBg });
      } else {
        update({ background: newBg });
      }
    },
    [bg, activeTab, selectedPageId, update, updatePageOverrides]
  );

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // 2MB cap
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setBg({ type: 'image', imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    },
    [setBg]
  );

  const SubTabs: BackgroundSubTab[] = ['solid', 'gradient', 'image', 'pattern'];

  return (
    <Section id="background" icon={ImageIcon} title="Background">
      {/* Sub-tabs */}
      <div className="theme-segmented mb-4 w-full">
        {SubTabs.map((tab) => (
          <button
            key={tab}
            className={`theme-segmented-btn flex-1 capitalize ${bgSubTab === tab ? 'active' : ''}`}
            onClick={() => {
              setBgSubTab(tab);
              setBg({ type: tab });
            }}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Solid */}
      {bgSubTab === 'solid' && (
        <div>
          <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Background Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bg.solidColor || '#ffffff'}
              onChange={(e) => setBg({ solidColor: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded border border-border"
            />
            <input
              type="text"
              value={bg.solidColor || ''}
              onChange={(e) => setBg({ solidColor: e.target.value })}
              placeholder="#ffffff"
              className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs"
            />
          </div>
        </div>
      )}

      {/* Gradient */}
      {bgSubTab === 'gradient' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground uppercase">
                From
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={bg.gradient?.from || '#3b82f6'}
                  onChange={(e) =>
                    setBg({
                      gradient: {
                        from: e.target.value,
                        to: bg.gradient?.to || '#8b5cf6',
                        angle: bg.gradient?.angle ?? 135,
                      },
                    })
                  }
                  className="h-7 w-7 cursor-pointer rounded border border-border"
                />
                <input
                  type="text"
                  value={bg.gradient?.from || ''}
                  onChange={(e) =>
                    setBg({
                      gradient: {
                        from: e.target.value,
                        to: bg.gradient?.to || '#8b5cf6',
                        angle: bg.gradient?.angle ?? 135,
                      },
                    })
                  }
                  placeholder="#3b82f6"
                  className="h-7 flex-1 rounded-md border border-border bg-background px-2 text-[11px]"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground uppercase">
                To
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={bg.gradient?.to || '#8b5cf6'}
                  onChange={(e) =>
                    setBg({
                      gradient: {
                        from: bg.gradient?.from || '#3b82f6',
                        to: e.target.value,
                        angle: bg.gradient?.angle ?? 135,
                      },
                    })
                  }
                  className="h-7 w-7 cursor-pointer rounded border border-border"
                />
                <input
                  type="text"
                  value={bg.gradient?.to || ''}
                  onChange={(e) =>
                    setBg({
                      gradient: {
                        from: bg.gradient?.from || '#3b82f6',
                        to: e.target.value,
                        angle: bg.gradient?.angle ?? 135,
                      },
                    })
                  }
                  placeholder="#8b5cf6"
                  className="h-7 flex-1 rounded-md border border-border bg-background px-2 text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Angle */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground uppercase">
              Angle: {bg.gradient?.angle ?? 135}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={bg.gradient?.angle ?? 135}
              onChange={(e) =>
                setBg({
                  gradient: {
                    from: bg.gradient?.from || '#3b82f6',
                    to: bg.gradient?.to || '#8b5cf6',
                    angle: Number(e.target.value),
                  },
                })
              }
              className="theme-slider"
            />
          </div>

          {/* Gradient preview */}
          <div
            className="h-12 rounded-lg border border-border"
            style={{
              background: `linear-gradient(${bg.gradient?.angle ?? 135}deg, ${bg.gradient?.from || '#3b82f6'}, ${bg.gradient?.to || '#8b5cf6'})`,
            }}
          />
        </div>
      )}

      {/* Image */}
      {bgSubTab === 'image' && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            type="button"
          >
            <Upload className="h-4 w-4" />
            Upload Image (max 2MB)
          </button>
          {bg.imageUrl && (
            <div className="relative">
              <img
                src={bg.imageUrl}
                alt="Background preview"
                className="h-24 w-full rounded-lg border border-border object-cover"
              />
              <button
                onClick={() => setBg({ imageUrl: undefined })}
                className="absolute top-1 right-1 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-foreground"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pattern */}
      {bgSubTab === 'pattern' && (
        <div>
          <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Pattern Preset
          </label>
          <div className="theme-pattern-grid">
            {PATTERN_OPTIONS.map((p) => (
              <button
                key={p.id}
                className={`theme-pattern-item ${bg.pattern === p.id ? 'active' : ''}`}
                onClick={() => setBg({ pattern: p.id })}
                title={p.label}
                type="button"
              >
                <div
                  className={`absolute inset-0 bg-muted form-bg-pattern-${p.id}`}
                  style={{ color: 'rgba(128,128,128,0.25)' }}
                />
                <span className="relative z-10 text-[9px] font-medium text-muted-foreground">
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Advanced ── */}
      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Advanced
        </p>
        <div className="space-y-3">
          {/* Blur */}
          <label className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Background Blur</span>
            <button
              onClick={() => setBg({ blur: !bg.blur })}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                bg.blur ? 'bg-primary' : 'bg-muted'
              }`}
              type="button"
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  bg.blur ? 'translate-x-4' : ''
                }`}
              />
            </button>
          </label>

          {/* Overlay opacity */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Overlay Opacity</span>
              <span className="text-[11px] font-medium text-foreground">
                {bg.overlayOpacity ?? 0}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={bg.overlayOpacity ?? 0}
              onChange={(e) =>
                setBg({ overlayOpacity: Number(e.target.value) })
              }
              className="theme-slider"
            />
          </div>

          {/* Fixed background */}
          <label className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Fixed Background</span>
            <button
              onClick={() => setBg({ fixed: !bg.fixed })}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                bg.fixed ? 'bg-primary' : 'bg-muted'
              }`}
              type="button"
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  bg.fixed ? 'translate-x-4' : ''
                }`}
              />
            </button>
          </label>
        </div>
      </div>
    </Section>
  );
}

// ════════════════════════════════════════════════════════════════
// Typography Section
// ════════════════════════════════════════════════════════════════

function TypographySection() {
  const theme = useFormStore(formSelectors.formTheme);
  const update = useFormStore((s) => s.updateFormTheme);
  const activeTab = useThemeUIStore((s) => s.activeTab);
  const selectedPageId = useThemeUIStore((s) => s.selectedPageId);
  const pages = useFormStore((s) => s.pages);
  const updatePageOverrides = useFormStore((s) => s.updatePageThemeOverrides);

  const headingFont = useMemo(() => {
    if (activeTab === 'page' && selectedPageId) {
      return (
        pages[selectedPageId]?.themeOverrides?.headingFont?.family ??
        theme?.headingFont?.family ??
        formFontNames.GoogleSans
      );
    }
    return theme?.headingFont?.family ?? formFontNames.GoogleSans;
  }, [activeTab, selectedPageId, pages, theme?.headingFont?.family]);

  const bodyFont = useMemo(() => {
    if (activeTab === 'page' && selectedPageId) {
      return (
        pages[selectedPageId]?.themeOverrides?.bodyFont?.family ??
        theme?.bodyFont?.family ??
        formFontNames.GoogleSans
      );
    }
    return theme?.bodyFont?.family ?? formFontNames.GoogleSans;
  }, [activeTab, selectedPageId, pages, theme?.bodyFont?.family]);

  const setHeadingFont = useCallback(
    (family: formFontName) => {
      if (activeTab === 'page' && selectedPageId) {
        updatePageOverrides(selectedPageId, { headingFont: { family } });
      } else {
        update({ headingFont: { family } });
      }
    },
    [activeTab, selectedPageId, update, updatePageOverrides]
  );

  const setBodyFont = useCallback(
    (family: formFontName) => {
      if (activeTab === 'page' && selectedPageId) {
        updatePageOverrides(selectedPageId, { bodyFont: { family } });
      } else {
        update({ bodyFont: { family } });
      }
    },
    [activeTab, selectedPageId, update, updatePageOverrides]
  );

  return (
    <Section id="typography" icon={Type} title="Typography">
      <div className="space-y-4">
        {/* Heading Font */}
        <div>
          <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Heading Font
          </label>
          <div className="relative">
            <select
              value={headingFont}
              onChange={(e) => setHeadingFont(e.target.value as formFontName)}
              className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              style={{
                fontFamily: `var(--font-${headingFont.toLowerCase().replace(/\s+/g, '-')})`,
              }}
            >
              {Object.entries(formFontNames).map(([key, name]) => (
                <option
                  key={key}
                  value={name}
                  style={{
                    fontFamily: `var(--font-${name.toLowerCase().replace(/\s+/g, '-')})`,
                  }}
                >
                  {name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Body Font */}
        <div>
          <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Body Font
          </label>
          <div className="relative">
            <select
              value={bodyFont}
              onChange={(e) => setBodyFont(e.target.value as formFontName)}
              className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              style={{
                fontFamily: `var(--font-${bodyFont.toLowerCase().replace(/\s+/g, '-')})`,
              }}
            >
              {Object.entries(formFontNames).map(([key, name]) => (
                <option
                  key={key}
                  value={name}
                  style={{
                    fontFamily: `var(--font-${name.toLowerCase().replace(/\s+/g, '-')})`,
                  }}
                >
                  {name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>
        </div>

        <div className="rounded-md bg-muted/30 p-2.5 text-[10px] leading-relaxed text-muted-foreground">
          <p>Heading font applies to labels and titles.</p>
          <p className="mt-1">
            Body font applies to input text and paragraphs.
          </p>
        </div>
      </div>
    </Section>
  );
}

// ════════════════════════════════════════════════════════════════
// Layout Section
// ════════════════════════════════════════════════════════════════

function LayoutSection() {
  const theme = useFormStore(formSelectors.formTheme);
  const update = useFormStore((s) => s.updateFormTheme);
  const activeTab = useThemeUIStore((s) => s.activeTab);
  const selectedPageId = useThemeUIStore((s) => s.selectedPageId);
  const pages = useFormStore((s) => s.pages);
  const updatePageOverrides = useFormStore((s) => s.updatePageThemeOverrides);

  const layout: FormThemeLayout = useMemo(() => {
    const g = theme?.layout ?? {
      formWidth: '800px' as const,
      cardStyle: 'elevated' as const,
      spacing: 'comfortable' as const,
    };
    if (activeTab === 'page' && selectedPageId) {
      const po = pages[selectedPageId]?.themeOverrides?.layout;
      return po ? { ...g, ...po } : g;
    }
    return g;
  }, [activeTab, selectedPageId, pages, theme?.layout]);

  const setLayout = useCallback(
    (partial: Partial<FormThemeLayout>) => {
      const newLayout = { ...layout, ...partial };
      if (activeTab === 'page' && selectedPageId) {
        updatePageOverrides(selectedPageId, { layout: newLayout });
      } else {
        update({ layout: newLayout });
      }
    },
    [layout, activeTab, selectedPageId, update, updatePageOverrides]
  );

  return (
    <Section id="layout" icon={Layout} title="Layout">
      {/* Form Width */}
      <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Form Width
      </label>
      <div className="theme-option-cards mb-4">
        {(['600px', '800px', 'full'] as const).map((w) => (
          <button
            key={w}
            className={`theme-option-card ${layout.formWidth === w ? 'active' : ''}`}
            onClick={() => setLayout({ formWidth: w })}
            type="button"
          >
            <div className="mb-1 flex justify-center">
              <div
                className="h-8 rounded border border-current"
                style={{
                  width: w === '600px' ? '60%' : w === '800px' ? '80%' : '100%',
                }}
              />
            </div>
            {w === 'full' ? 'Full' : w}
          </button>
        ))}
      </div>

      {/* Card Style */}
      <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Card Style
      </label>
      <div className="theme-option-cards mb-4">
        {(['flat', 'elevated', 'glassmorphism'] as const).map((style) => (
          <button
            key={style}
            className={`theme-option-card ${layout.cardStyle === style ? 'active' : ''}`}
            onClick={() => setLayout({ cardStyle: style })}
            type="button"
          >
            <div className="mb-1 flex justify-center">
              {style === 'flat' && (
                <div className="h-8 w-full rounded border border-current" />
              )}
              {style === 'elevated' && (
                <div className="h-8 w-full rounded border border-current shadow-md" />
              )}
              {style === 'glassmorphism' && (
                <div
                  className="h-8 w-full rounded border"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
                    borderColor: 'rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(4px)',
                  }}
                />
              )}
            </div>
            {style === 'glassmorphism'
              ? 'Glass'
              : style.charAt(0).toUpperCase() + style.slice(1)}
          </button>
        ))}
      </div>

      {/* Spacing */}
      <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Spacing
      </label>
      <div className="theme-segmented w-full">
        {(['compact', 'comfortable', 'spacious'] as const).map((sp) => (
          <button
            key={sp}
            className={`theme-segmented-btn flex-1 capitalize ${layout.spacing === sp ? 'active' : ''}`}
            onClick={() => setLayout({ spacing: sp })}
            type="button"
          >
            {sp}
          </button>
        ))}
      </div>
    </Section>
  );
}

// ════════════════════════════════════════════════════════════════
// Component Properties Section
// ════════════════════════════════════════════════════════════════

function ComponentPropsSection() {
  const theme = useFormStore(formSelectors.formTheme);
  const update = useFormStore((s) => s.updateFormTheme);
  const activeTab = useThemeUIStore((s) => s.activeTab);
  const selectedPageId = useThemeUIStore((s) => s.selectedPageId);
  const pages = useFormStore((s) => s.pages);
  const updatePageOverrides = useFormStore((s) => s.updatePageThemeOverrides);

  const cp: FormThemeComponentProps = useMemo(() => {
    const g = theme?.componentProps ?? {
      shadow: 'sm' as const,
      borderRadius: 'md' as const,
      borderWidth: '1' as const,
    };
    if (activeTab === 'page' && selectedPageId) {
      const po = pages[selectedPageId]?.themeOverrides?.componentProps;
      return po ? { ...g, ...po } : g;
    }
    return g;
  }, [activeTab, selectedPageId, pages, theme?.componentProps]);

  const setCp = useCallback(
    (partial: Partial<FormThemeComponentProps>) => {
      const newCp = { ...cp, ...partial };
      if (activeTab === 'page' && selectedPageId) {
        updatePageOverrides(selectedPageId, { componentProps: newCp });
      } else {
        update({ componentProps: newCp });
      }
    },
    [cp, activeTab, selectedPageId, update, updatePageOverrides]
  );

  return (
    <Section id="componentProps" icon={BoxSelect} title="Component Properties">
      {/* Shadow */}
      <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Shadow
      </label>
      <div className="theme-segmented mb-4 w-full">
        {SHADOW_OPTIONS.map((s) => (
          <button
            key={s}
            className={`theme-segmented-btn flex-1 capitalize ${cp.shadow === s ? 'active' : ''}`}
            onClick={() => setCp({ shadow: s })}
            type="button"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Border Radius */}
      <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Border Radius
      </label>
      <div className="theme-segmented mb-4 w-full">
        {RADIUS_OPTIONS.map((r) => (
          <button
            key={r}
            className={`theme-segmented-btn flex-1 capitalize ${cp.borderRadius === r ? 'active' : ''}`}
            onClick={() => setCp({ borderRadius: r })}
            type="button"
          >
            {r}
          </button>
        ))}
      </div>

      {/* Border Width */}
      <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Border Width
      </label>
      <div className="theme-segmented w-full">
        {BORDER_OPTIONS.map((b) => (
          <button
            key={b}
            className={`theme-segmented-btn flex-1 ${cp.borderWidth === b ? 'active' : ''}`}
            onClick={() => setCp({ borderWidth: b })}
            type="button"
          >
            {b === '0' ? 'None' : `${b}px`}
          </button>
        ))}
      </div>
    </Section>
  );
}

// ════════════════════════════════════════════════════════════════
// Page Theme Selector (for Page tab)
// ════════════════════════════════════════════════════════════════

function PageSelector() {
  const form = useFormStore((s) => s.form);
  const pages = useFormStore((s) => s.pages);
  const selectedPageId = useThemeUIStore((s) => s.selectedPageId);
  const setSelectedPageId = useThemeUIStore((s) => s.setSelectedPageId);

  if (!form) return null;

  return (
    <div className="border-b border-border px-4 py-3">
      <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Select Page
      </label>
      <select
        value={selectedPageId ?? ''}
        onChange={(e) => setSelectedPageId(e.target.value || null)}
        className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
      >
        <option value="">— Choose a page —</option>
        {form.pages.map((pageId, i) => (
          <option key={pageId} value={pageId}>
            {pages[pageId]?.title || `Page ${i + 1}`}
          </option>
        ))}
      </select>
      {selectedPageId && pages[selectedPageId]?.themeOverrides && (
        <button
          onClick={() => {
            // Clear page overrides
            useFormStore
              .getState()
              .updatePageThemeOverrides(selectedPageId, undefined);
          }}
          className="mt-2 text-[11px] text-destructive hover:underline"
          type="button"
        >
          Reset page to global theme
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Live Preview Panel
// ════════════════════════════════════════════════════════════════

function LivePreview() {
  const form = useFormStore((s) => s.form);
  const pages = useFormStore((s) => s.pages);
  const formName = useFormStore((s) => s.form?.name ?? '');

  if (!form || form.pages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">No pages to preview</p>
      </div>
    );
  }

  // Use first page's overrides for preview (if any)
  const firstPageId = form.pages[0];
  const pageOverrides = pages[firstPageId]?.themeOverrides;

  return (
    <FormThemeProvider pageOverrides={pageOverrides}>
      <div className="h-full overflow-y-auto">
        <div className="px-4 py-6">
          <div className="mb-4 text-center">
            <span className="inline-block rounded-full bg-black/5 px-3 py-1 text-[10px] font-medium tracking-widest uppercase dark:bg-white/10">
              Live Preview
            </span>
          </div>

          <div className="mx-auto w-full max-w-3xl">
            {/* Form title */}
            <div className="mb-5">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {formName || 'Untitled Form'}
              </h2>
            </div>

            {/* Render all actual form pages */}
            <FormModeProvider value="view">
              {form.pages.map((pageId, index) => {
                const page = pages[pageId];
                const hasChildren = (page?.children ?? []).length > 0;

                return (
                  <div key={pageId} className="mb-6">
                    {/* Page title (for multi-page forms) */}
                    {form.pages.length > 1 && (
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          {page?.title || `Page ${index + 1}`}
                        </h3>
                        {page?.description && (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {page.description}
                          </p>
                        )}
                      </div>
                    )}

                    {hasChildren ? (
                      <RenderPage pageId={pageId} index={index} />
                    ) : (
                      <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border/40 py-12 text-muted-foreground/40">
                        <p className="text-xs">
                          No components on {page?.title || `Page ${index + 1}`}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </FormModeProvider>
          </div>
        </div>
      </div>
    </FormThemeProvider>
  );
}

// ════════════════════════════════════════════════════════════════
// Main ThemingPage export
// ════════════════════════════════════════════════════════════════

export function ThemingPage() {
  const activeTab = useThemeUIStore((s) => s.activeTab);
  const setActiveTab = useThemeUIStore((s) => s.setActiveTab);

  return (
    <div className="theme-editor">
      {/* ── Left: Controls ── */}
      <div className="theme-editor-controls">
        {/* Tab bar: Global / Page */}
        <div className="theme-tab-bar">
          <button
            className={`theme-tab-btn ${activeTab === 'global' ? 'active' : ''}`}
            onClick={() => setActiveTab('global')}
            type="button"
          >
            Global
          </button>
          <button
            className={`theme-tab-btn ${activeTab === 'page' ? 'active' : ''}`}
            onClick={() => setActiveTab('page')}
            type="button"
          >
            Page
          </button>
        </div>

        {/* Page selector (only in Page tab) */}
        {activeTab === 'page' && <PageSelector />}

        {/* Sections */}
        <div>
          <ColorsSection />
          <BackgroundSection />
          <TypographySection />
          <LayoutSection />
          <ComponentPropsSection />
        </div>
      </div>

      {/* ── Right: Preview ── */}
      <div className="theme-editor-preview bg-neutral-100 dark:bg-neutral-900">
        <LivePreview />
      </div>
    </div>
  );
}
