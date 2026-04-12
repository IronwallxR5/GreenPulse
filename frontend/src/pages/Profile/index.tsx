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
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account information</p>
      </div>

      {/* Avatar + name card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-4 shadow-md">
          <span className="text-3xl font-bold text-white">
            {profile?.name?.[0]?.toUpperCase() ?? '?'}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{profile?.name ?? '—'}</h2>
        <p className="text-gray-500 text-sm mt-1">{profile?.email ?? '—'}</p>
        <div className="mt-3 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified Account
        </div>
      </div>

      {/* Info rows */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Full Name</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{profile?.name ?? '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-4">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Mail className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Email Address</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{profile?.email ?? '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-4">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Member Since</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{memberSince}</p>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Session</h3>
        <p className="text-xs text-gray-400 mb-4">Signing out will clear your local session. You'll need to log in again to access your projects.</p>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
