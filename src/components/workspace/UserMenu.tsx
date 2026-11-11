import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, Shield, Sparkles, Sun, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import AISettingsModal from './AISettingsModal';

export default function UserMenu() {
  const { user, logout, isGuest } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
  );

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (typeof document !== 'undefined') {
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('blackbook-theme', next ? 'dark' : 'light');
      } catch {
        // Ignore storage errors
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  const initial = (user.name?.trim()[0] || 'B').toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 rounded-xl px-2">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-primary/25 bg-primary/15 text-[10px] font-semibold text-primary">
              {initial || <UserIcon className="h-3 w-3" />}
            </span>
          )}
          <span className="text-xs font-medium max-w-[78px] truncate">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            {user.email && (
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            )}
            <p className="text-[11px] font-medium text-primary/90">
              {isGuest ? 'Guest Session (Local)' : 'Synchronized Account'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && (
          <>
            <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium">Admin Console</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {isGuest && (
          <>
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              Sign in to unlock note sharing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => setAiSettingsOpen(true)} className="gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>AI Brain Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme} className="gap-2">
          {isDark ? (
            <>
              <Sun className="h-4 w-4 text-[#F5B971]" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-primary" />
              <span>Dark Mode</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4 text-muted-foreground" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
      <AISettingsModal open={aiSettingsOpen} onOpenChange={setAiSettingsOpen} />
    </DropdownMenu>
  );
}
