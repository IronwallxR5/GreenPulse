import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
import { Leaf, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const getErrorMessage = (error: unknown) => {
  if (typeof error !== 'object' || error === null) {
    return 'Invalid email or password. Please try again.';
  }

  const response = (error as { response?: { data?: { message?: string; errors?: Array<{ message?: string }> } } })
    .response;

  return response?.data?.message || response?.data?.errors?.[0]?.message || 'Invalid email or password. Please try again.';
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError('');
    try {
      const res = await authService.login(values);
      login(res.token, res.user);
      navigate('/dashboard');
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-warm-50 route-enter">
      <div className="pointer-events-none absolute inset-0 bg-grid-soft opacity-30" />
      <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-forest-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-gold-200/35 blur-3xl" />

      <div className="relative z-10 hidden lg:flex lg:w-[55%] flex-col justify-between p-14 xl:p-16">
        <div className="surface-strong relative flex h-full flex-col justify-between overflow-hidden p-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-forest-500/30 blur-3xl" />
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-gold-300/20 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-[440px] reveal-up">
            <h1 className="font-display text-[2.9rem] font-bold leading-[1.08] text-warm-50">
              Quantify impact,
              <br />
              redesign for efficiency.
            </h1>

            <p className="mt-5 text-[15px] leading-relaxed text-forest-200">
              Track compute, storage, network, and API emissions from one atmospheric control panel built for climate-aware teams.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-forest-700 bg-forest-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-forest-400">Visibility</p>
                <p className="mt-2 font-display text-2xl text-warm-50">100%</p>
                <p className="text-xs text-forest-300">Realtime carbon activity map</p>
              </div>
              <div className="rounded-2xl border border-forest-700 bg-forest-900/60 p-4 animate-float">
                <p className="text-xs uppercase tracking-[0.16em] text-forest-400">Teams</p>
                <p className="mt-2 font-display text-2xl text-warm-50">120+</p>
                <p className="text-xs text-forest-300">Projects monitored this month</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 border-t border-forest-800 pt-6 text-xs text-forest-400">
            Sustainable decisions begin with high-quality measurement.
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center p-6 sm:p-8 lg:p-14">
        <div className="surface-card reveal-up stagger-1 w-full max-w-[430px] p-7 sm:p-8">

          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-900">
              <Leaf className="h-4 w-4 text-gold-500" />
            </div>
            <span className="font-display text-xl font-semibold text-warm-950">GreenPulse</span>
          </div>

          <p className="section-heading">Authentication</p>
          <h2 className="mb-1 mt-2 font-display text-[2rem] font-bold text-warm-950">Welcome back</h2>
          <p className="mb-8 text-sm text-warm-600">Sign in to continue tracking your carbon footprint</p>

          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-warm-800 font-medium text-sm">Email address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-500" />
                        <Input
                          placeholder="you@example.com"
                          className="h-11 border-warm-200 bg-white pl-10 text-warm-950 focus-visible:ring-forest-700"
                          autoComplete="email"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-warm-800 font-medium text-sm">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-500" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="h-11 border-warm-200 bg-white pl-10 pr-10 focus-visible:ring-forest-700"
                          autoComplete="current-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-500 transition-colors hover:text-forest-700"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="mt-1 h-11 w-full rounded-lg bg-forest-900 font-semibold text-warm-50 transition-all duration-200 hover:bg-forest-800"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-warm-200" />
              <span className="text-xs text-warm-500">or continue with</span>
              <div className="flex-1 h-px bg-warm-200" />
            </div>

            <button
              type="button"
              id="google-signin-btn"
              onClick={() => authService.loginWithGoogle()}
              className="mt-3 flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-warm-200 bg-white text-sm font-medium text-warm-950 shadow-warm-sm transition-all duration-200 hover:bg-warm-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </Form>

          <p className="mt-8 text-center text-sm text-warm-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-forest-900 hover:text-forest-700 transition-colors">
              Create one free
            </Link>
          </p>

          <p className="mt-5 text-center text-xs text-warm-400">
            By signing in, you agree to track your carbon impact responsibly.
          </p>

        </div>
      </div>
    </div>
  );
}
