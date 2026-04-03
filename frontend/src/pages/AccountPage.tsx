import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, LogOut, Mail, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Account — Form Builder';
  }, []);

  const handleSignOut = () => {
    logout();
    navigate('/login');
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
          <h1 className="text-lg font-semibold">Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your profile and account identifiers.
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 border border-border bg-background p-4">
              <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Display name</p>
                <p className="text-sm font-medium">{user?.displayName || 'Unknown user'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 border border-border bg-background p-4">
              <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user?.email || 'Not available'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 border border-border bg-background p-4">
              <KeyRound className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">User ID</p>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {user?.uid || '—'}
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <Button variant="outline" onClick={handleSignOut} className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
