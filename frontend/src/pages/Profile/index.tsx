import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, LogOut, Loader2, PencilLine } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null) {
    return fallback;
  }

  const response = (error as { response?: { data?: { message?: string; errors?: Array<{ message?: string }> } } })
    .response;

  return response?.data?.message || response?.data?.errors?.[0]?.message || fallback;
};

export default function Profile() {
  const { logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [nameError, setNameError] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: authService.me,
  });

  useEffect(() => {
    if (profile?.name) {
      setDraftName(profile.name);
    }
  }, [profile?.name]);

  const updateNameMutation = useMutation({
    mutationFn: async (name: string) => authService.updateProfile({ name }),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['me'], updatedProfile);
      updateUser(updatedProfile);
      setIsEditingName(false);
      setNameError('');
    },
    onError: (error: unknown) => {
      setNameError(getErrorMessage(error, 'Failed to update name. Please try again.'));
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStartEditName = () => {
    setDraftName(profile?.name ?? '');
    setNameError('');
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setDraftName(profile?.name ?? '');
    setNameError('');
    setIsEditingName(false);
  };

  const handleSaveName = () => {
    const trimmedName = draftName.trim();

    if (trimmedName.length < 2) {
      setNameError('Name must be at least 2 characters.');
      return;
    }

    if (trimmedName === (profile?.name ?? '')) {
      setIsEditingName(false);
      setNameError('');
      return;
    }

    updateNameMutation.mutate(trimmedName);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-forest-600" />
      </div>
    );
  }

  const createdAtDate = profile?.createdAt ? new Date(profile.createdAt) : null;
  const hasValidCreatedAt = !!createdAtDate && !Number.isNaN(createdAtDate.getTime());

  const memberSince = hasValidCreatedAt && createdAtDate
    ? createdAtDate.toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—';

  const initials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="mx-auto max-w-3xl space-y-5 route-enter">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-warm-950">My Profile</h1>
          <p className="mt-1 text-sm text-warm-600">Manage your account details.</p>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="gap-2 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <section className="surface-card reveal-up p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-500 text-forest-950 shadow-warm-sm">
            <span className="font-display text-xl font-bold">{initials}</span>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-warm-950">{profile?.name ?? '—'}</h2>
            <p className="mt-1 text-sm text-warm-700">{profile?.email ?? '—'}</p>
            <p className="mt-1 text-xs text-warm-500">Member since {memberSince}</p>
          </div>
        </div>
      </section>

      <section className="surface-card reveal-up stagger-1 p-5 sm:p-6">
        <h3 className="font-display text-xl font-bold text-warm-950">Account details</h3>

        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-warm-200/90 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-warm-200 bg-forest-50">
                  <User className="h-4 w-4 text-forest-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-warm-500">Full name</p>

                  {isEditingName ? (
                    <div className="mt-2">
                      <Input
                        value={draftName}
                        onChange={(event) => {
                          setDraftName(event.target.value);
                          if (nameError) setNameError('');
                        }}
                        maxLength={80}
                        className="h-9 max-w-sm border-warm-200 bg-white focus-visible:ring-forest-700"
                        aria-label="Edit full name"
                      />

                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveName}
                          className="h-8 bg-forest-900 px-3 text-xs font-semibold text-warm-50 hover:bg-forest-800"
                          disabled={updateNameMutation.isPending}
                        >
                          {updateNameMutation.isPending ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving</>
                          ) : (
                            'Save'
                          )}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEditName}
                          className="h-8 border-warm-200 px-3 text-xs text-warm-700 hover:bg-warm-100"
                          disabled={updateNameMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </div>

                      {nameError && <p className="mt-2 text-xs text-red-600">{nameError}</p>}
                    </div>
                  ) : (
                    <p className="mt-1 truncate text-sm font-semibold text-warm-950">{profile?.name ?? '—'}</p>
                  )}
                </div>
              </div>

              {!isEditingName && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleStartEditName}
                  className="h-8 px-2.5 text-xs text-forest-700 hover:bg-forest-100"
                >
                  <PencilLine className="h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-warm-200/90 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-warm-200 bg-gold-50">
                <Mail className="h-4 w-4 text-gold-700" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-warm-500">Email address</p>
                <p className="mt-1 break-all text-sm font-semibold text-warm-950">{profile?.email ?? '—'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-warm-200/90 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-warm-200 bg-warm-100">
                <Calendar className="h-4 w-4 text-warm-700" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-warm-500">Member since</p>
                <p className="mt-1 text-sm font-semibold text-warm-950">{memberSince}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
