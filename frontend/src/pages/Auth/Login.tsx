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
import { Leaf, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

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
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Invalid email or password. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel (desktop only) ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] bg-forest-950 flex-col items-center justify-center p-16 relative overflow-hidden">

        {/* Ambient concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full border border-forest-900/70" />
          <div className="absolute w-[420px] h-[420px] rounded-full border border-forest-900/70" />
          <div className="absolute w-[250px] h-[250px] rounded-full border border-forest-800/50" />
        </div>

        <div className="relative z-10 text-center max-w-[360px]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500 mb-10 shadow-2xl">
            <Leaf className="w-8 h-8 text-forest-950" />
          </div>

          <h1 className="font-display text-[2.6rem] leading-[1.15] font-bold text-warm-50 mb-5">
            Measure what<br />matters most
          </h1>

          <p className="text-forest-400 text-[15px] leading-relaxed">
            Track carbon across compute, storage, and network infrastructure — all in one place.
          </p>

          <div className="mt-12 pt-8 border-t border-forest-900 flex items-center justify-center gap-14">
            {[
              { num: '100+', desc: 'Projects tracked' },
              { num: '1.2t', desc: 'CO₂e measured' },
            ].map(({ num, desc }) => (
              <div key={desc} className="text-center">
                <p className="text-gold-400 text-2xl font-bold font-display">{num}</p>
                <p className="text-forest-500 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ─────────────────────────────────────── */}
      <div className="flex-1 bg-warm-50 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-lg bg-forest-900 flex items-center justify-center">
              <Leaf className="h-4 w-4 text-gold-500" />
            </div>
            <span className="font-display text-xl font-semibold text-warm-950">GreenPulse</span>
          </div>

          <h2 className="font-display text-[2rem] font-bold text-warm-950 mb-1">Welcome back</h2>
          <p className="text-warm-600 text-sm mb-8">Sign in to continue tracking your carbon footprint</p>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-5">
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
                          className="pl-10 h-11 border-warm-200 bg-white focus:border-forest-800 text-warm-950"
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
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 h-11 border-warm-200 bg-white focus:border-forest-800"
                          autoComplete="current-password"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 bg-forest-900 hover:bg-forest-800 text-warm-50 font-semibold rounded-lg transition-all duration-200 shadow-sm mt-1"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 h-px bg-warm-200" />
              <span className="text-xs text-warm-500">or continue with</span>
              <div className="flex-1 h-px bg-warm-200" />
            </div>

            {/* Google */}
            <button
              type="button"
              id="google-signin-btn"
              onClick={() => authService.loginWithGoogle()}
              className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-warm-200 bg-white hover:bg-warm-100 text-warm-950 font-medium text-sm transition-all duration-200 mt-3 shadow-warm-sm"
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
            By signing in, you agree to track your carbon impact responsibly 🌱
          </p>
        </div>
      </div>
    </div>
  );
}
