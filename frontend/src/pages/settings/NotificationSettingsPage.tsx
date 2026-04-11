import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, BellRing, Mail } from 'lucide-react';

// shadcn components
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const STORAGE_KEY = 'user_notification_settings';

interface NotificationSettings {
  productUpdates: boolean;
  submissionAlerts: boolean;
  sharedFormAlerts: boolean;
}

const defaultSettings: NotificationSettings = {
  productUpdates: true,
  submissionAlerts: true,
  sharedFormAlerts: true,
} as const;

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return {
          ...defaultSettings,
          ...(JSON.parse(raw) as Partial<NotificationSettings>),
        };
      }
    } catch {
      // Ignore parse errors and return defaults
    }
    return defaultSettings;
  });
  
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.title = 'Notifications — Form Builder';
  }, []);

  const toggle = (key: keyof NotificationSettings) => {
    setSaved(false);
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
  };

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
            <Link to="/settings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </Link>
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Notification Settings
            </CardTitle>
            <CardDescription className="text-base">
              Control which updates you receive from Form Builder.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {[
              {
                id: 'productUpdates',
                label: 'Product updates and announcements',
                icon: Mail,
              },
              {
                id: 'submissionAlerts',
                label: 'Submission alerts for owned forms',
                icon: Bell,
              },
              {
                id: 'sharedFormAlerts',
                label: 'Shared form updates',
                icon: BellRing,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <Label
                      htmlFor={item.id}
                      className="cursor-pointer text-sm font-medium text-foreground"
                    >
                      {item.label}
                    </Label>
                  </div>
                  <Checkbox
                    id={item.id}
                    checked={settings[item.id as keyof NotificationSettings]}
                    onCheckedChange={() =>
                      toggle(item.id as keyof NotificationSettings)
                    }
                    className="h-5 w-5"
                  />
                </div>
              );
            })}
          </CardContent>

          <CardFooter className="flex items-center gap-4 border-t bg-muted/20 px-4 py-4">
            <Button onClick={save} className="w-full sm:w-auto">
              Save Preferences
            </Button>
            {saved && (
              <p className="text-sm font-medium text-muted-foreground">
                Preferences saved.
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}