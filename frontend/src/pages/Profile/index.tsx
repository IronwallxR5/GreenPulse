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
    <div className="max-w-xl mx-auto space-y-6">

      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-warm-950">My Profile</h1>
        <p className="text-warm-600 text-sm mt-1">Manage your account information</p>
      </div>

      {/* Avatar card */}
      <div className="bg-forest-950 rounded-2xl p-8 flex flex-col items-center text-center shadow-warm-md">
        <div className="w-20 h-20 rounded-full bg-gold-500 flex items-center justify-center mb-4 shadow-lg">
          <span className="text-2xl font-bold text-forest-950 font-display">{initials}</span>
        </div>
        <h2 className="font-display text-xl font-bold text-warm-50">{profile?.name ?? '—'}</h2>
        <p className="text-forest-400 text-sm mt-1">{profile?.email ?? '—'}</p>
        <div className="mt-4 px-3 py-1.5 rounded-full bg-forest-900 text-gold-400 text-xs font-semibold flex items-center gap-1.5 border border-forest-800">
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified Account
        </div>
      </div>

      {/* Info rows */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-warm-sm overflow-hidden divide-y divide-warm-100">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="w-9 h-9 rounded-lg bg-forest-50 border border-warm-200 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-forest-700" />
          </div>
          <div>
            <p className="text-xs font-medium text-warm-500 uppercase tracking-wide">Full Name</p>
            <p className="text-sm font-semibold text-warm-950 mt-0.5">{profile?.name ?? '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 px-5 py-4">
          <div className="w-9 h-9 rounded-lg bg-gold-50 border border-warm-200 flex items-center justify-center flex-shrink-0">
            <Mail className="h-4 w-4 text-gold-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-warm-500 uppercase tracking-wide">Email Address</p>
            <p className="text-sm font-semibold text-warm-950 mt-0.5">{profile?.email ?? '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 px-5 py-4">
          <div className="w-9 h-9 rounded-lg bg-warm-100 border border-warm-200 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-4 w-4 text-warm-700" />
          </div>
          <div>
            <p className="text-xs font-medium text-warm-500 uppercase tracking-wide">Member Since</p>
            <p className="text-sm font-semibold text-warm-950 mt-0.5">{memberSince}</p>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-warm-sm p-5">
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
