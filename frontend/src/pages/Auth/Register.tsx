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
import { Leaf, Mail, Lock, User, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

// Schema matches backend validateRegister: name (min 2), email, password (min 6)
const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setError('');
    try {
      const res = await authService.register(values);
      login(res.token, res.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Registration failed. Please try again.'
      );
    }
  };

  const password = form.watch('password');
  const passwordStrength = password.length === 0 ? null : password.length < 6 ? 'weak' : password.length < 10 ? 'medium' : 'strong';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-green-100 opacity-60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-emerald-100 opacity-60 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-600 shadow-lg mb-4">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">GreenPulse</h1>
          <p className="text-gray-500 mt-1 text-sm">Carbon footprint tracking platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Create your account</h2>
            <p className="text-gray-500 text-sm mt-1">Start tracking your carbon footprint today</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Full name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="John Doe"
                          className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                          autoComplete="name"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Email address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="you@example.com"
                          className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                          autoComplete="email"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="password"
                          placeholder="Min. 6 characters"
                          className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                          autoComplete="new-password"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    {/* Password strength indicator */}
                    {passwordStrength && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-1 flex-1">
                          <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength === 'weak' ? 'bg-red-400' : 'bg-green-500'}`} />
                          <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength === 'medium' || passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-200'}`} />
                          <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-200'}`} />
                        </div>
                        <span className={`text-xs font-medium ${passwordStrength === 'weak' ? 'text-red-500' : passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                          {passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'medium' ? 'Good' : 'Strong'}
                        </span>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* API Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Benefits list */}
              <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 space-y-1">
                {['Track carbon footprint across projects', 'Monitor compute, storage & network emissions', 'Get actionable sustainability insights'].map(benefit => (
                  <div key={benefit} className="flex items-center gap-2 text-xs text-green-700">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create free account'
                )}
              </Button>
            </form>
          </Form>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-green-600 hover:text-green-700 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Your data is used solely to track your carbon impact 🌍
        </p>
      </div>
    </div>
  );
}
