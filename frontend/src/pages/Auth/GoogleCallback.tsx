import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import { Leaf, Loader2, AlertCircle } from 'lucide-react';

/**
 * Landing page for the Google OAuth redirect.
 * URL: /auth/callback?token=<jwt>
 *
 * Reads the JWT from the query string, fetches the user profile via /me,
 * stores the session in AuthContext, then navigates to /dashboard.
 */
export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const oauthError = searchParams.get('error');

    if (oauthError || !token) {
      setError('Google sign-in failed. Please try again.');
      const timer = setTimeout(() => navigate('/login'), 3000);
      return () => clearTimeout(timer);
    }

    // Store the token first so the /me request is authenticated
    localStorage.setItem('token', token);

    authService
      .me()
      .then((user) => {
        login(token, user);
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        localStorage.removeItem('token');
        setError('Could not load your profile. Please try again.');
        const timer = setTimeout(() => navigate('/login'), 3000);
        return () => clearTimeout(timer);
      });
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-warm-50 p-4 route-enter">
      <div className="pointer-events-none absolute inset-0 bg-grid-soft opacity-30" />
      <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-forest-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-gold-200/35 blur-3xl" />

      <div className="surface-card relative z-10 w-full max-w-md p-8 text-center">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-900 shadow-warm-md">
          <Leaf className="h-8 w-8 text-gold-400" />
        </div>

        {error ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <p className="text-xs text-warm-500">Redirecting you back to login...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-forest-700" />
            <p className="font-medium text-warm-700">Signing you in with Google...</p>
            <p className="text-xs text-warm-500">This will only take a moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
