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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-600 shadow-lg mb-6">
          <Leaf className="w-8 h-8 text-white" />
        </div>

        {error ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-5 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <p className="text-xs text-gray-400">Redirecting you back to login…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <p className="text-gray-600 font-medium">Signing you in with Google…</p>
            <p className="text-xs text-gray-400">This will only take a moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
