import { useQuery } from '@tanstack/react-query';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, LogOut, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function Profile() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: authService.me,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-forest-600" />
      </div>
    );
  }

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—';

  const initials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="mx-auto max-w-2xl space-y-6 route-enter">

      <div>
        <p className="section-heading">Account Center</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-warm-950">My Profile</h1>
        <p className="mt-1 text-sm text-warm-600">Manage your account information and session controls</p>
      </div>

      <div className="surface-strong reveal-up relative overflow-hidden p-8 text-center">
        <div className="pointer-events-none absolute -left-20 top-8 h-48 w-48 rounded-full bg-forest-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-12 h-44 w-44 rounded-full bg-gold-300/25 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gold-500 shadow-lg">
          <span className="text-2xl font-bold text-forest-950 font-display">{initials}</span>
        </div>
          <h2 className="font-display text-xl font-bold text-warm-50">{profile?.name ?? '—'}</h2>
          <p className="mt-1 text-sm text-forest-300">{profile?.email ?? '—'}</p>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-gold-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Account
          </div>
        </div>
      </div>

      <div className="surface-card reveal-up stagger-1 divide-y divide-warm-100 overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-warm-200 bg-forest-50">
            <User className="h-4 w-4 text-forest-700" />
          </div>
          <div>
            <p className="text-xs font-medium text-warm-500 uppercase tracking-wide">Full Name</p>
            <p className="text-sm font-semibold text-warm-950 mt-0.5">{profile?.name ?? '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 px-5 py-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-warm-200 bg-gold-50">
            <Mail className="h-4 w-4 text-gold-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-warm-500 uppercase tracking-wide">Email Address</p>
            <p className="text-sm font-semibold text-warm-950 mt-0.5">{profile?.email ?? '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 px-5 py-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-warm-200 bg-warm-100">
            <Calendar className="h-4 w-4 text-warm-700" />
          </div>
          <div>
            <p className="text-xs font-medium text-warm-500 uppercase tracking-wide">Member Since</p>
            <p className="text-sm font-semibold text-warm-950 mt-0.5">{memberSince}</p>
          </div>
        </div>
      </div>

      <div className="surface-card reveal-up stagger-2 p-5">
        <h3 className="text-sm font-semibold text-warm-800 mb-1">Session</h3>
        <p className="text-xs text-warm-500 mb-4">
          Signing out will clear your local session. You'll need to log in again to access your projects.
        </p>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="gap-2 text-red-600 border-warm-200 hover:bg-red-50 hover:border-red-200"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
