/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/FormEditor/components/ThemePanel.tsx
import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { useFormStore, formSelectors } from '@/form/store/form.store';
import { useThemeUIStore } from '@/form/theme/theme.store';
import type { FormThemeBackground } from '@/form/components/base';
import {
  ChevronDown,
  ChevronRight,
  Palette,
  Image as ImageIcon,
  Upload,
  X,
  Type,
} from 'lucide-react';
import { formFontNames, type formFontName } from '@/form/theme/formTheme';
import type { ThemeSection, BackgroundSubTab } from '@/form/theme/theme.store';
import { ColorPicker } from '@/components/ColorPicker';
import { Button } from '@/components/ui/button';
import {
  Share2,
  Trash2,
  Sparkles,
  User as UserIcon,
  Users,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useThemeTemplateStore,
  type ThemeTemplate,
} from '@/form/store/themeTemplate.store';
import { SaveThemeDialog } from './SaveThemeDialog';
import { EditThemeDialog } from './EditThemeDialog';
import { DeleteThemeDialog } from './DeleteThemeDialog';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const PATTERN_OPTIONS: { id: FormThemeBackground['pattern']; label: string }[] =
  [
    { id: 'dots', label: 'Dots' },
    { id: 'grid', label: 'Grid' },
    { id: 'diagonal', label: 'Lines' },
    { id: 'waves', label: 'Waves' },
    { id: 'plus', label: 'Plus' },
    { id: 'topography', label: 'Topography' },
    { id: 'noise', label: 'Noise' },
  ];

// const SHADOW_OPTIONS: FormThemeComponentProps['shadow'][] = [
//   'none',
//   'sm',
//   'md',
//   'lg',
// ];
// const RADIUS_OPTIONS: FormThemeComponentProps['borderRadius'][] = [
//   'none',
//   'sm',
//   'md',
//   'lg',
//   'full',
// ];
// const BORDER_OPTIONS: FormThemeComponentProps['borderWidth'][] = [
//   '0',
//   '1',
//   '2',
// ];

// const BUTTON_STYLE_OPTIONS: NonNullable<
//   FormThemeComponentProps['buttonStyle']
// >[] = ['solid', 'outline', 'glass', 'gradient', 'soft'];
// const INPUT_STYLE_OPTIONS: NonNullable<
//   FormThemeComponentProps['inputStyle']
// >[] = ['default', 'pill', 'underlined', 'filled'];

import type { FormTheme } from '@/form/components/base';
// const PRESETS: { name: string; theme: Partial<FormTheme>; preview: string }[] =
//   [
//     {
//       name: 'Midnight Glow',
//       preview: 'linear-gradient(135deg, #0f172a, #1e293b, #334155)',
//       theme: {
//         mode: 'light',
//         primaryColor: '#22d3ee',
//         secondaryColor: '#818cf8',
//         background: {
//           type: 'mesh',
//           mesh: {
//             colors: [
//               '#0f172a',
//               '#1e293b',
//               '#334155',
//               '#22d3ee',
//               '#818cf8',
//               '#000000',
//             ],
//           },
//           animated: true,
//         },
//         layout: {
//           formWidth: '800px',
//           cardStyle: 'glassmorphism',
//           spacing: 'comfortable',
//         },
//         componentProps: {
//           shadow: 'lg',
//           borderRadius: 'lg',
//           borderWidth: '1',
//           buttonStyle: 'gradient',
//           inputStyle: 'default',
//         },
//       },
//     },
//     {
//       name: 'Sunset Breeze',
//       preview: 'linear-gradient(135deg, #fb923c, #ec4899, #8b5cf6)',
//       theme: {
//         mode: 'light',
//         primaryColor: '#f97316',
//         secondaryColor: '#ec4899',
//         background: {
//           type: 'mesh',
//           mesh: {
//             colors: [
//               '#ffedd5',
//               '#fef3c7',
//               '#fae8ff',
//               '#fb923c',
//               '#ec4899',
//               '#8b5cf6',
//             ],
//           },
//           animated: true,
//         },
//         layout: {
//           formWidth: '800px',
//           cardStyle: 'elevated',
//           spacing: 'spacious',
//         },
//         componentProps: {
//           shadow: 'md',
//           borderRadius: 'full',
//           borderWidth: '0',
//           buttonStyle: 'gradient',
//           inputStyle: 'pill',
//         },
//       },
//     },
//     {
//       name: 'Modern Clean',
//       preview: '#ffffff',
//       theme: {
//         mode: 'light',
//         primaryColor: '#171717',
//         secondaryColor: '#737373',
//         background: { type: 'solid', solidColor: '#ffffff' },
//         layout: {
//           formWidth: '800px',
//           cardStyle: 'flat',
//           spacing: 'comfortable',
//         },
//         componentProps: {
//           shadow: 'none',
//           borderRadius: 'md',
//           borderWidth: '1',
//           buttonStyle: 'solid',
//           inputStyle: 'underlined',
//         },
//       },
//     },
//     {
//       name: 'Cyberpunk',
//       preview:
//         'repeating-linear-gradient(45deg, #000, #000 10px, #111 10px, #111 20px)',
//       theme: {
//         mode: 'light',
//         primaryColor: '#f43f5e',
//         secondaryColor: '#06b6d4',
//         background: { type: 'pattern', pattern: 'grid' },
//         layout: {
//           formWidth: 'full',
//           cardStyle: 'elevated',
//           spacing: 'compact',
//         },
//         componentProps: {
//           shadow: 'xl',
//           borderRadius: 'none',
//           borderWidth: '2',
//           buttonStyle: 'outline',
//           inputStyle: 'filled',
//         },
//       },
//     },
//   ];

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
        className="theme-section-header flex w-full items-center justify-between"
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

function ThemeLibrarySection() {
  const { user } = useAuth();
  const { themes, loadThemes, addTheme, removeTheme, updateTheme, isLoading } =
    useThemeTemplateStore();
  const updateFormTheme = useFormStore((s) => s.updateFormTheme);
  const currentTheme = useFormStore(formSelectors.formTheme);

  const isSaveOpen = useThemeUIStore((s) => s.isSaveThemeOpen);
  const setIsSaveOpen = useThemeUIStore((s) => s.setIsSaveThemeOpen);

  const [editingTheme, setEditingTheme] = useState<ThemeTemplate | null>(null);
  const [deletingTheme, setDeletingTheme] = useState<ThemeTemplate | null>(
    null
  );

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  const personalThemes = themes.filter((t) => t.createdBy === user?.uid);
  const sharedThemes = themes.filter((t) => t.createdBy !== user?.uid);

  const handleApply = (theme: FormTheme) => {
    updateFormTheme(theme);
    toast.success('Theme applied successfully');
  };

  const handleSaveNew = async (name: string) => {
    if (!currentTheme) return;
    try {
      await addTheme(name, currentTheme);
      toast.success('Theme saved to your library');
    } catch (err) {
      toast.error('Failed to save theme');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<ThemeTemplate>) => {
    try {
      await updateTheme(id, updates);
      toast.success('Theme updated');
    } catch (err) {
      toast.error('Failed to update theme');
    }
  };

  const handleDelete = async () => {
    if (!deletingTheme) return;
    try {
      await removeTheme(deletingTheme.id);
      toast.success('Theme deleted');
      setDeletingTheme(null);
    } catch (err) {
      toast.error('Failed to delete theme');
    }
  };

  const ThemeItem = ({
    item,
    isOwner,
  }: {
    item: ThemeTemplate;
    isOwner: boolean;
  }) => (
    <div className="group relative flex flex-col overflow-hidden rounded-md border border-border bg-card/40 transition-all hover:bg-card">
      <div
        className="h-10 w-full cursor-pointer transition-opacity group-hover:opacity-90"
        style={{
          background:
            item.theme.background?.type === 'mesh'
              ? `radial-gradient(at top left, ${item.theme.primaryColor || '#22d3ee'}, transparent), 
               radial-gradient(at bottom right, ${item.theme.secondaryColor || '#818cf8'}, transparent), #1e293b`
              : item.theme.background?.solidColor || '#525252',
        }}
        onClick={() => handleApply(item.theme)}
      />
      <div className="p-2">
        <div className="flex items-center justify-between">
          <span className="truncate text-[11px] font-medium text-foreground">
            {item.name}
          </span>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {isOwner && (
              <>
                <button
                  onClick={() => setEditingTheme(item)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Share2 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setDeletingTheme(item)}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between text-[9px] text-muted-foreground">
          <span>{item.creatorEmail || 'Unknown'}</span>
          {item.isPublic && (
            <Badge
              variant="outline"
              className="h-3 px-1 text-[8px] leading-none font-normal"
            >
              Public
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Section id="library" icon={Sparkles} title="Theme Library">
      <Button
        variant="outline"
        size="sm"
        className="mb-4 h-8 w-full gap-2 border-dashed text-xs"
        onClick={() => setIsSaveOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        Save Current Theme
      </Button>

      {personalThemes.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            <UserIcon className="h-2.5 w-2.5" />
            My Themes
          </div>
          <div className="grid grid-cols-2 gap-2">
            {personalThemes.map((t) => (
              <ThemeItem key={t.id} item={t} isOwner={true} />
            ))}
          </div>
        </div>
      )}

      {sharedThemes.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            <Users className="h-2.5 w-2.5" />
            Shared with me
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sharedThemes.map((t) => (
              <ThemeItem key={t.id} item={t} isOwner={false} />
            ))}
          </div>
        </div>
      )}

      {isLoading &&
        personalThemes.length === 0 &&
        sharedThemes.length === 0 && (
          <div className="py-4 text-center text-xs text-muted-foreground">
            Loading library...
          </div>
        )}

      {!isLoading &&
        personalThemes.length === 0 &&
        sharedThemes.length === 0 && (
          <div className="py-4 text-center text-[11px] text-muted-foreground italic">
            Your theme library is empty.
          </div>
        )}

      <SaveThemeDialog
        open={isSaveOpen}
        onOpenChange={setIsSaveOpen}
        onSave={handleSaveNew}
      />

      {editingTheme && (
        <EditThemeDialog
          theme={editingTheme}
          open={!!editingTheme}
          onOpenChange={(open) => !open && setEditingTheme(null)}
          onSave={handleUpdate}
        />
      )}

      {deletingTheme && (
        <DeleteThemeDialog
          themeName={deletingTheme.name}
          open={!!deletingTheme}
          onOpenChange={(open) => !open && setDeletingTheme(null)}
          onConfirm={handleDelete}
        />
      )}
    </Section>
  );
}

// function PresetsSection() {
//   const update = useFormStore((s) => s.updateFormTheme);

//   return (
//     <div className="border-b border-border p-4">
//       <label className="mb-3 block text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
//         Theme Presets
//       </label>
//       <div className="grid grid-cols-2 gap-3">
//         {PRESETS.map((p) => (
//           <button
//             key={p.name}
//             onClick={() => update(p.theme)}
//             className="group relative flex h-20 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted transition-all hover:border-primary/50"
//             type="button"
//           >
//             <div
//               className="absolute inset-0 opacity-40 transition-opacity group-hover:opacity-100"
//               style={{ background: p.preview }}
//             />
//             <span className="relative z-10 text-[10px] font-bold text-foreground drop-shadow-sm transition-transform group-hover:scale-110">
//               {p.name}
//             </span>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }

// ════════════════════════════════════════════════════════════════
// Colors Section
// ════════════════════════════════════════════════════════════════

function ColorsSection() {
  const theme = useFormStore(formSelectors.formTheme);
  const update = useFormStore((s) => s.updateFormTheme);

  const activeTab = useThemeUIStore((s) => s.activeTab);
  const selectedPageId = useThemeUIStore((s) => s.selectedPageId);
  const pages = useFormStore((s) => s.pages);
  const updatePageOverrides = useFormStore((s) => s.updatePageThemeOverrides);

  const currentPrimary = useMemo(() => {
    if (activeTab === 'page' && selectedPageId) {
      return (
        pages[selectedPageId]?.themeOverrides?.primaryColor ??
        theme?.primaryColor ??
        ''
      );
    }
    return theme?.primaryColor ?? '';
  }, [activeTab, selectedPageId, pages, theme?.primaryColor]);

  const currentSecondary = useMemo(() => {
    if (activeTab === 'page' && selectedPageId) {
      return (
        pages[selectedPageId]?.themeOverrides?.secondaryColor ??
        theme?.secondaryColor ??
        ''
      );
    }
    return theme?.secondaryColor ?? '';
  }, [activeTab, selectedPageId, pages, theme?.secondaryColor]);

  const setPrimary = useCallback(
    (primaryColor: string) => {
      if (activeTab === 'page' && selectedPageId) {
        updatePageOverrides(selectedPageId, { primaryColor });
      } else {
        update({ primaryColor });
      }
    },
    [activeTab, selectedPageId, update, updatePageOverrides]
  );

  const setSecondary = useCallback(
    (secondaryColor: string) => {
      if (activeTab === 'page' && selectedPageId) {
        updatePageOverrides(selectedPageId, { secondaryColor });
      } else {
        update({ secondaryColor });
      }
    },
    [activeTab, selectedPageId, update, updatePageOverrides]
  );

  return (
    <Section id="colors" icon={Palette} title="Colors">
      <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Custom Colors
      </label>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">
            Primary Color
          </label>
          <div className="flex items-center gap-2">
            <ColorPicker
              value={currentPrimary || '#000000'}
              onChange={setPrimary}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">
            Secondary Color
          </label>
          <div className="flex items-center gap-2">
            <ColorPicker
              value={currentSecondary || '#ffffff'}
              onChange={setSecondary}
            />
          </div>
        </div>
      </div>
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

  const SubTabs: BackgroundSubTab[] = [
    'solid',
    'gradient',
    'mesh',
    'image',
    'pattern',
  ];

  return (
    <Section id="background" icon={ImageIcon} title="Background">
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

      {bgSubTab === 'solid' && (
        <div>
          <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Background Color
          </label>
          <ColorPicker
            value={bg.solidColor || '#ffffff'}
            onChange={(color) => setBg({ solidColor: color })}
          />
        </div>
      )}

      {bgSubTab === 'gradient' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground uppercase">
                From
              </label>
              <ColorPicker
                value={bg.gradient?.from || '#3b82f6'}
                onChange={(color) =>
                  setBg({
                    gradient: {
                      from: color,
                      to: bg.gradient?.to || '#8b5cf6',
                      angle: bg.gradient?.angle ?? 135,
                    },
                  })
                }
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground uppercase">
                To
              </label>
              <ColorPicker
                value={bg.gradient?.to || '#8b5cf6'}
                onChange={(color) =>
                  setBg({
                    gradient: {
                      from: bg.gradient?.from || '#3b82f6',
                      to: color,
                      angle: bg.gradient?.angle ?? 135,
                    },
                  })
                }
              />
            </div>
          </div>

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

          <div
            className="h-12 rounded-lg border border-border"
            style={{
              background: `linear-gradient(${bg.gradient?.angle ?? 135}deg, ${bg.gradient?.from || '#3b82f6'}, ${bg.gradient?.to || '#8b5cf6'})`,
            }}
          />
        </div>
      )}

      {bgSubTab === 'mesh' && (
        <div className="space-y-4">
          <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Mesh Colors
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <ColorPicker
                  value={bg.mesh?.colors?.[i] || '#3b82f6'}
                  onChange={(color) => {
                    const colors = [...(bg.mesh?.colors || [])];
                    while (colors.length <= i) colors.push('#3b82f6');
                    colors[i] = color;
                    setBg({ mesh: { colors } });
                  }}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const randomColors = Array.from(
                { length: 6 },
                () =>
                  `#${Math.floor(Math.random() * 16777215)
                    .toString(16)
                    .padStart(6, '0')}`
              );
              setBg({ mesh: { colors: randomColors } });
            }}
            className="w-full rounded-md border border-border bg-muted/50 py-2 text-xs font-medium text-foreground hover:bg-muted"
            type="button"
          >
            Randomize Mesh
          </button>
        </div>
      )}

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

      <div className="mt-4 border-t border-border pt-4">
        {/* <p className="mb-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Advanced
        </p> */}
        <div className="space-y-3">
          <label className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Animated Background</span>
            <button
              onClick={() => setBg({ animated: !bg.animated })}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                bg.animated ? 'bg-primary' : 'bg-muted'
              }`}
              type="button"
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  bg.animated ? 'translate-x-4' : ''
                }`}
              />
            </button>
          </label>

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

// function LayoutSection() {
//   const theme = useFormStore(formSelectors.formTheme);
//   const update = useFormStore((s) => s.updateFormTheme);
//   const activeTab = useThemeUIStore((s) => s.activeTab);
//   const selectedPageId = useThemeUIStore((s) => s.selectedPageId);
//   const pages = useFormStore((s) => s.pages);
//   const updatePageOverrides = useFormStore((s) => s.updatePageThemeOverrides);

//   const layout: FormThemeLayout = useMemo(() => {
//     const g = theme?.layout ?? {
//       formWidth: '800px' as const,
//       cardStyle: 'elevated' as const,
//       spacing: 'comfortable' as const,
//     };
//     if (activeTab === 'page' && selectedPageId) {
//       const po = pages[selectedPageId]?.themeOverrides?.layout;
//       return po ? { ...g, ...po } : g;
//     }
//     return g;
//   }, [activeTab, selectedPageId, pages, theme?.layout]);

//   const setLayout = useCallback(
//     (partial: Partial<FormThemeLayout>) => {
//       const newLayout = { ...layout, ...partial };
//       if (activeTab === 'page' && selectedPageId) {
//         updatePageOverrides(selectedPageId, { layout: newLayout });
//       } else {
//         update({ layout: newLayout });
//       }
//     },
//     [layout, activeTab, selectedPageId, update, updatePageOverrides]
//   );

//   return (
//     <Section id="layout" icon={Layout} title="Layout">
//       <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
//         Form Width
//       </label>
//       <div className="theme-option-cards mb-4">
//         {(['600px', '800px', 'full'] as const).map((w) => (
//           <button
//             key={w}
//             className={`theme-option-card ${layout.formWidth === w ? 'active' : ''}`}
//             onClick={() => setLayout({ formWidth: w })}
//             type="button"
//           >
//             <div className="mb-1 flex justify-center">
//               <div
//                 className="h-8 rounded border border-current"
//                 style={{
//                   width: w === '600px' ? '60%' : w === '800px' ? '80%' : '100%',
//                 }}
//               />
//             </div>
//             {w === 'full' ? 'Full' : w}
//           </button>
//         ))}
//       </div>

//       <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
//         Card Style
//       </label>
//       <div className="theme-option-cards mb-4">
//         {(['flat', 'elevated', 'glassmorphism'] as const).map((style) => (
//           <button
//             key={style}
//             className={`theme-option-card ${layout.cardStyle === style ? 'active' : ''}`}
//             onClick={() => setLayout({ cardStyle: style })}
//             type="button"
//           >
//             <div className="mb-1 flex justify-center">
//               {style === 'flat' && (
//                 <div className="h-8 w-full rounded border border-current" />
//               )}
//               {style === 'elevated' && (
//                 <div className="h-8 w-full rounded border border-current shadow-md" />
//               )}
//               {style === 'glassmorphism' && (
//                 <div
//                   className="h-8 w-full rounded border"
//                   style={{
//                     background:
//                       'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
//                     borderColor: 'rgba(255,255,255,0.3)',
//                     backdropFilter: 'blur(4px)',
//                   }}
//                 />
//               )}
//             </div>
//             {style === 'glassmorphism'
//               ? 'Glass'
//               : style.charAt(0).toUpperCase() + style.slice(1)}
//           </button>
//         ))}
//       </div>

//       <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
//         Spacing
//       </label>
//       <div className="theme-segmented w-full">
//         {(['compact', 'comfortable', 'spacious'] as const).map((sp) => (
//           <button
//             key={sp}
//             className={`theme-segmented-btn flex-1 capitalize ${layout.spacing === sp ? 'active' : ''}`}
//             onClick={() => setLayout({ spacing: sp })}
//             type="button"
//           >
//             {sp}
//           </button>
//         ))}
//       </div>
//     </Section>
//   );
// }

// ════════════════════════════════════════════════════════════════
// Component Properties Section
// ════════════════════════════════════════════════════════════════

// function ComponentPropsSection() {
//   const theme = useFormStore(formSelectors.formTheme);
//   const update = useFormStore((s) => s.updateFormTheme);
//   const activeTab = useThemeUIStore((s) => s.activeTab);
//   const selectedPageId = useThemeUIStore((s) => s.selectedPageId);
//   const pages = useFormStore((s) => s.pages);
//   const updatePageOverrides = useFormStore((s) => s.updatePageThemeOverrides);

//   const cp: FormThemeComponentProps = useMemo(() => {
//     const g = theme?.componentProps ?? {
//       shadow: 'sm' as const,
//       borderRadius: 'md' as const,
//       borderWidth: '1' as const,
//     };
//     if (activeTab === 'page' && selectedPageId) {
//       const po = pages[selectedPageId]?.themeOverrides?.componentProps;
//       return po ? { ...g, ...po } : g;
//     }
//     return g;
//   }, [activeTab, selectedPageId, pages, theme?.componentProps]);

//   const setCp = useCallback(
//     (partial: Partial<FormThemeComponentProps>) => {
//       const newCp = { ...cp, ...partial };
//       if (activeTab === 'page' && selectedPageId) {
//         updatePageOverrides(selectedPageId, { componentProps: newCp });
//       } else {
//         update({ componentProps: newCp });
//       }
//     },
//     [cp, activeTab, selectedPageId, update, updatePageOverrides]
//   );

//   return (
//     <Section id="componentProps" icon={BoxSelect} title="Component Properties">
//       <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
//         Shadow
//       </label>
//       <div className="theme-segmented mb-4 w-full">
//         {SHADOW_OPTIONS.map((s) => (
//           <button
//             key={s}
//             className={`theme-segmented-btn flex-1 capitalize ${cp.shadow === s ? 'active' : ''}`}
//             onClick={() => setCp({ shadow: s })}
//             type="button"
//           >
//             {s}
//           </button>
//         ))}
//       </div>

//       <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
//         Border Radius
//       </label>
//       <div className="theme-segmented mb-4 w-full">
//         {RADIUS_OPTIONS.map((r) => (
//           <button
//             key={r}
//             className={`theme-segmented-btn flex-1 capitalize ${cp.borderRadius === r ? 'active' : ''}`}
//             onClick={() => setCp({ borderRadius: r })}
//             type="button"
//           >
//             {r}
//           </button>
//         ))}
//       </div>

//       <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
//         Border Width
//       </label>
//       <div className="theme-segmented mb-4 w-full">
//         {BORDER_OPTIONS.map((b) => (
//           <button
//             key={b}
//             className={`theme-segmented-btn flex-1 ${cp.borderWidth === b ? 'active' : ''}`}
//             onClick={() => setCp({ borderWidth: b })}
//             type="button"
//           >
//             {b === '0' ? 'None' : `${b}px`}
//           </button>
//         ))}
//       </div>

//       <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
//         Button Style
//       </label>
//       <div className="theme-option-cards mb-4">
//         {BUTTON_STYLE_OPTIONS.map((style) => (
//           <button
//             key={style}
//             className={`theme-option-card ${cp.buttonStyle === style ? 'active' : ''}`}
//             onClick={() => setCp({ buttonStyle: style })}
//             type="button"
//           >
//             {style.charAt(0).toUpperCase() + style.slice(1)}
//           </button>
//         ))}
//       </div>

//       <label className="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
//         Input Style
//       </label>
//       <div className="theme-option-cards">
//         {INPUT_STYLE_OPTIONS.map((style) => (
//           <button
//             key={style}
//             className={`theme-option-card ${cp.inputStyle === style ? 'active' : ''}`}
//             onClick={() => setCp({ inputStyle: style })}
//             type="button"
//           >
//             {style.charAt(0).toUpperCase() + style.slice(1)}
//           </button>
//         ))}
//       </div>
//     </Section>
//   );
// }

// ════════════════════════════════════════════════════════════════
// Main ThemePanel export
// ════════════════════════════════════════════════════════════════

export function ThemePanel() {
  const theme = useFormStore(formSelectors.formTheme);
  const pages = useFormStore((s) => s.pages);
  const activeTab = useThemeUIStore((s) => s.activeTab);
  const selectedPageId = useThemeUIStore((s) => s.selectedPageId);
  const syncWithTheme = useThemeUIStore((s) => s.syncWithTheme);

  useEffect(() => {
    syncWithTheme(theme, pages);
  }, [syncWithTheme, theme, pages, activeTab, selectedPageId]);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Tab bar: Global / Page */}
      {/* <div className="theme-tab-bar border-b border-border">
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
      </div> */}

      {/* Page selector (only in Page tab) */}
      {/* {activeTab === 'page' && <PageSelector />} */}

      {/* Sections Scrollable Area */}
      <div className="flex-1 overflow-y-auto pb-8">
        {/* <PresetsSection /> */}
        <ThemeLibrarySection />
        <ColorsSection />
        <BackgroundSection />
        <TypographySection />
        {/* <LayoutSection /> */}
        {/* <ComponentPropsSection /> */}
      </div>
    </div>
  );
}
