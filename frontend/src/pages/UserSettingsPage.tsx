import { useEffect, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  BellRing,
  Clock3,
  Keyboard,
  Layers,
  Mail,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';

function SettingsNavCard({
  to,
  icon: Icon,
  label,
  description,
}: {
  to: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  description?: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col gap-1 border border-border bg-neutral-50 p-3 text-left transition-colors hover:bg-muted/40 dark:bg-neutral-900/60"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          {label}
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </span>
      {description ? (
        <span className="pl-6 text-[11px] leading-snug text-muted-foreground">{description}</span>
      ) : null}
    </Link>
  );
}

export default function UserSettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    document.title = 'User Settings — Form Builder';
  }, []);

  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' && document.documentElement.classList.contains('dark'));

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="pl-0">
            <Link to="/">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="border border-border bg-neutral-50 p-5 shadow-sm dark:bg-neutral-900/70">
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Account, editor help, shortcuts, and preferences.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 border border-border bg-background px-3 py-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Signed in as</span>
            <span className="font-medium">{user?.email || user?.displayName || 'User'}</span>
            <span className="text-muted-foreground">·</span>
            <Link to="/settings/account" className="text-primary underline-offset-4 hover:underline">
              Account details
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 border border-border bg-background p-4">
              {isDarkMode ? (
                <Moon className="mt-0.5 h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="mt-0.5 h-4 w-4 text-muted-foreground" />
              )}
              <div className="w-full">
                <p className="text-xs text-muted-foreground">App theme</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                  >
                    Light
                  </Button>
                  <Button
                    size="sm"
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                  >
                    Dark
                  </Button>
                  <Button
                    size="sm"
                    variant={theme === 'system' ? 'default' : 'outline'}
                    onClick={() => setTheme('system')}
                  >
                    System
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Pages
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <SettingsNavCard
                  to="/settings/account"
                  icon={User}
                  label="Account"
                  description="Profile, user ID, sign out"
                />
                <SettingsNavCard
                  to="/keyboard-shortcuts"
                  icon={Keyboard}
                  label="Keyboard shortcuts"
                  description="Builder and navigation keys"
                />
                <SettingsNavCard
                  to="/settings/editor-theme-templates"
                  icon={Layers}
                  label="Editor theme & templates"
                  description="Theme panel and template groups"
                />
                <SettingsNavCard
                  to="/settings/activity"
                  icon={Clock3}
                  label="Activity"
                  description="Recent forms and submissions"
                />
                <SettingsNavCard
                  to="/settings/notifications"
                  icon={BellRing}
                  label="Notifications"
                  description="Email and alert preferences"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              <Mail className="mr-1 inline h-3 w-3 align-text-bottom" />
              Email and name are managed on the Account page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
