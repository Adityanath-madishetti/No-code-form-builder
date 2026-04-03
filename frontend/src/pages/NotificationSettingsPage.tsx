import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, BellRing, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
};

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...defaultSettings, ...(JSON.parse(raw) as Partial<NotificationSettings>) };
      }
    } catch {
      // Ignore
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
          <Button asChild variant="ghost" size="sm" className="pl-0">
            <Link to="/settings">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Settings
            </Link>
          </Button>
        </div>

        <div className="border border-border bg-neutral-50 p-5 shadow-sm dark:bg-neutral-900/70">
          <div className="mb-4 flex items-center gap-2">
            <BellRing className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Notification Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Control which updates you receive from Form Builder.
          </p>

          <div className="mt-6 space-y-3">
            <label className="flex items-center justify-between border border-border bg-background p-3">
              <span className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Product updates and announcements
              </span>
              <input
                type="checkbox"
                checked={settings.productUpdates}
                onChange={() => toggle('productUpdates')}
              />
            </label>

            <label className="flex items-center justify-between border border-border bg-background p-3">
              <span className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Submission alerts for owned forms
              </span>
              <input
                type="checkbox"
                checked={settings.submissionAlerts}
                onChange={() => toggle('submissionAlerts')}
              />
            </label>

            <label className="flex items-center justify-between border border-border bg-background p-3">
              <span className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Shared form updates
              </span>
              <input
                type="checkbox"
                checked={settings.sharedFormAlerts}
                onChange={() => toggle('sharedFormAlerts')}
              />
            </label>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Button onClick={save}>Save Preferences</Button>
            {saved && <p className="text-xs text-muted-foreground">Preferences saved.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
