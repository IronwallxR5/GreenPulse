import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Leaf, LogOut, LayoutDashboard, BarChart3 } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics', icon: BarChart3,        label: 'Analytics'  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 w-[220px] bg-forest-950 flex flex-col">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-forest-900/80">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gold-500 shadow-md group-hover:bg-gold-400 transition-colors">
              <Leaf className="h-4 w-4 text-forest-950" />
            </div>
            <span className="font-display text-[17px] font-semibold text-warm-50 tracking-tight">
              GreenPulse
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-forest-900 text-warm-50 border-l-[3px] border-gold-500 pl-[9px]'
                    : 'text-forest-400 hover:bg-forest-900/50 hover:text-forest-200 border-l-[3px] border-transparent'
                }`}
              >
                <Icon
                  className={`h-4 w-4 flex-shrink-0 transition-colors ${
                    active ? 'text-gold-400' : 'text-forest-500 group-hover:text-forest-300'
                  }`}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-forest-900/80 space-y-1">
          <Link
            to="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
              location.pathname === '/profile'
                ? 'bg-forest-900 border-l-[3px] border-gold-500 pl-[9px]'
                : 'hover:bg-forest-900/50 border-l-[3px] border-transparent'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-forest-950 shadow">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-forest-200 truncate">{user?.name}</p>
              <p className="text-[11px] text-forest-500">Profile</p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-forest-500 hover:bg-red-950/40 hover:text-red-400 transition-all duration-150 border-l-[3px] border-transparent"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="pl-[220px] flex-1 min-h-screen bg-warm-50">
        <main className="max-w-[1200px] mx-auto px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
