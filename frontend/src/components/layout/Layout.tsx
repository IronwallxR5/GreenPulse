import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Leaf,
  LogOut,
  LayoutDashboard,
  BarChart3,
  Sparkles,
  Menu,
  X,
  UserCircle2,
  CalendarDays,
  Command,
  ArrowUpRight,
  Orbit,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics', icon: BarChart3,        label: 'Analytics'  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activePage = useMemo(() => {
    if (location.pathname.startsWith('/dashboard')) return 'Dashboard';
    if (location.pathname.startsWith('/analytics')) return 'Analytics';
    if (location.pathname.startsWith('/projects/')) return 'Project Details';
    if (location.pathname.startsWith('/profile')) return 'Profile';
    return 'GreenPulse';
  }, [location.pathname]);

  const workspaceDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(new Date()),
    [],
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isNavActive = (to: string) => location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-24 h-80 w-80 rounded-full bg-forest-300/20 blur-3xl animate-float" />
        <div className="absolute -right-20 top-8 h-72 w-72 rounded-full bg-gold-300/25 blur-3xl animate-float" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-forest-200/35 blur-3xl animate-drift" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] flex-col border-r border-forest-800/70 bg-forest-950/95 px-4 pb-4 pt-5 text-warm-50 backdrop-blur lg:flex">
        <Link to="/dashboard" className="group rounded-2xl border border-forest-800/90 bg-forest-900/85 p-4 transition-colors hover:border-forest-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/95 shadow-lg transition-transform group-hover:scale-[1.03]">
              <Leaf className="h-5 w-5 text-forest-950" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold leading-tight tracking-tight">GreenPulse</p>
              <p className="text-xs text-forest-300">Eco Impact Control Room</p>
            </div>
          </div>
        </Link>

        <div className="mt-5 rounded-2xl border border-forest-800/80 bg-forest-900/50 p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-forest-400">Realtime</p>
          <div className="mt-2 flex items-center gap-2 text-sm font-medium text-forest-100">
            <Sparkles className="h-4 w-4 text-gold-400 animate-pulseSoft" />
            Carbon analytics online
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-forest-800/80 bg-forest-900/40 p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-forest-400">Pulse Queue</p>
          <div className="mt-2 space-y-2 text-xs text-forest-200">
            <div className="surface-ghost flex items-center justify-between border-forest-800/70 bg-forest-900/65 px-2.5 py-2">
              <span className="inline-flex items-center gap-1.5"><Orbit className="h-3.5 w-3.5 text-gold-300" />Budget Watch</span>
              <span className="text-gold-300">Armed</span>
            </div>
            <div className="surface-ghost flex items-center justify-between border-forest-800/70 bg-forest-900/65 px-2.5 py-2">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-forest-300" />Schedule</span>
              <span className="text-forest-100">{workspaceDateLabel}</span>
            </div>
          </div>
        </div>

        <nav className="mt-6 flex-1 space-y-1.5">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = isNavActive(to);
            return (
              <Link
                key={to}
                to={to}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-forest-700/70 text-warm-50 shadow-glow-forest'
                    : 'text-forest-300 hover:bg-forest-800/70 hover:text-warm-50'
                }`}
              >
                <Icon className={`h-4 w-4 transition-colors ${active ? 'text-gold-300' : 'text-forest-400 group-hover:text-gold-300'}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-forest-800/80 pt-4">
          <Link
            to="/profile"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
              isNavActive('/profile')
                ? 'bg-forest-700/70 text-warm-50 shadow-glow-forest'
                : 'text-forest-200 hover:bg-forest-800/70'
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-forest-950">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-forest-400">Profile & account</p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-forest-300 transition-colors hover:bg-red-900/40 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-warm-200/80 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-warm-200 bg-white text-warm-700 shadow-warm-sm"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-900">
              <Leaf className="h-4 w-4 text-gold-400" />
            </div>
            <div>
              <span className="block font-display text-lg font-semibold leading-none text-warm-950">GreenPulse</span>
              <span className="text-[10px] uppercase tracking-[0.16em] text-warm-500">{activePage}</span>
            </div>
          </Link>

          <Link
            to="/profile"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-warm-200 bg-white text-warm-700 shadow-warm-sm"
            aria-label="Open profile"
          >
            <UserCircle2 className="h-5 w-5" />
          </Link>
        </div>

        {mobileOpen && (
          <div className="mx-auto mt-3 max-w-[1200px] rounded-2xl border border-warm-200 bg-white p-2 shadow-warm-md">
            <nav className="space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => {
                const active = isNavActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                      active
                        ? 'bg-forest-100 text-forest-800'
                        : 'text-warm-700 hover:bg-warm-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                  isNavActive('/profile')
                    ? 'bg-forest-100 text-forest-800'
                    : 'text-warm-700 hover:bg-warm-100'
                }`}
              >
                <UserCircle2 className="h-4 w-4" />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </nav>
          </div>
        )}
      </header>

      <div className="relative lg:pl-[280px]">
        <div className="hidden border-b border-warm-200/80 bg-white/70 backdrop-blur lg:block">
          <div className="mx-auto grid max-w-[1300px] grid-cols-[1fr_auto] items-center gap-4 px-8 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-warm-500">Workspace</p>
              <div className="mt-1 flex items-center gap-3">
                <h1 className="font-display text-2xl font-semibold text-warm-950">{activePage}</h1>
                <span className="badge-soft border-warm-200 bg-white text-warm-700">{workspaceDateLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-warm-200 bg-white px-3 py-1.5 text-xs text-warm-700 shadow-warm-sm">
                <span className="h-2 w-2 rounded-full bg-forest-500 animate-pulseSoft" />
                Live ingestion active
              </div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full border border-forest-200 bg-forest-50 px-3 py-1.5 text-xs font-semibold text-forest-700 transition-colors hover:bg-forest-100"
              >
                <Command className="h-3.5 w-3.5" />
                Command Deck
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-[1300px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div key={location.pathname} className="route-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
