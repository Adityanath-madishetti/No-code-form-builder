import { useEffect, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/theme-provider';

// shadcn components
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Icons
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
  Monitor,
} from 'lucide-react';

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
    <Link to={to} className="group focus:outline-none">
      <Card className="flex h-full flex-col transition-all hover:border-primary/50 hover:bg-muted/30">
        <CardContent className="flex flex-1 items-start justify-between gap-4 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                {label}
              </h4>
              {description && (
                <p className="mt-1 text-xs leading-snug text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </CardContent>
      </Card>
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
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="pl-0 text-muted-foreground hover:text-foreground"
          >
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Settings
            </CardTitle>
            <CardDescription className="text-base">
              Manage your account, editor preferences, shortcuts, and
              application theme.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* User Identity Banner */}
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Signed in as
                </span>
                <span className="text-sm font-medium text-foreground">
                  {user?.email || user?.displayName || 'User'}
                </span>
              </div>
              <span className="hidden text-muted-foreground sm:inline">·</span>
              <Link
                to="/settings/account"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Account details
              </Link>
            </div>

            {/* Theme Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">
                Appearance
              </h3>
              <div className="flex flex-col justify-between gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    {isDarkMode ? (
                      <Moon className="h-5 w-5 text-foreground" />
                    ) : (
                      <Sun className="h-5 w-5 text-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      App Theme
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Select your preferred interface mode.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                    className="w-[85px]"
                  >
                    <Sun className="mr-2 h-3.5 w-3.5" />
                    Light
                  </Button>
                  <Button
                    size="sm"
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                    className="w-[85px]"
                  >
                    <Moon className="mr-2 h-3.5 w-3.5" />
                    Dark
                  </Button>
                  <Button
                    size="sm"
                    variant={theme === 'system' ? 'default' : 'outline'}
                    onClick={() => setTheme('system')}
                    className="w-[95px]"
                  >
                    <Monitor className="mr-2 h-3.5 w-3.5" />
                    System
                  </Button>
                </div>
              </div>
            </div>

            {/* Navigation Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">
                Preferences & Navigation
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <SettingsNavCard
                  to="/settings/account"
                  icon={User}
                  label="Account"
                  description="Profile, user ID, sign out"
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
                <SettingsNavCard
                  to="/keyboard-shortcuts"
                  icon={Keyboard}
                  label="Keyboard shortcuts"
                  description="Builder and navigation keys"
                />
              </div>
            </div>

            {/* Footer Note */}
            <div className="flex items-center gap-2 border-t pt-6 text-xs text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Email and name are managed on the Account page.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
