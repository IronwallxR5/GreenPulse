import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Leaf, LogOut } from 'lucide-react';
import { Button } from '../ui/button';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Leaf className="h-6 w-6 text-primary" />
          <span>GreenPulse</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium hidden sm:inline-block">
            {user?.name}
          </span>
          <Button className="hover:bg-accent hover:text-accent-foreground p-2 rounded-md bg-transparent text-foreground shadow-none" onClick={logout} title="Logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
