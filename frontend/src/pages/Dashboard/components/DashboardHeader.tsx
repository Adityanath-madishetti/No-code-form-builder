import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Keyboard, LogOut, Moon, Settings, Sun, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' && document.documentElement.classList.contains('dark'));

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-neutral-50 px-6 py-3 dark:bg-neutral-950/60">
      <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <img src="/logo.png" alt="Form Builder" className="h-6 w-6" />
        Form Builder
      </h1>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
          className="group"
        >
          {isDarkMode ? (
            <Sun className="h-3.5 w-3.5 transition-colors group-hover:fill-current" />
          ) : (
            <Moon className="h-3.5 w-3.5 transition-colors group-hover:fill-current" />
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label="User menu"
              title="User menu"
            >
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem disabled className="opacity-100">
              <span className="truncate text-muted-foreground">{user?.email || 'Signed in user'}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/keyboard-shortcuts">
                <Keyboard className="h-3.5 w-3.5" />
                Keyboard shortcuts
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings className="h-3.5 w-3.5" />
                User settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
