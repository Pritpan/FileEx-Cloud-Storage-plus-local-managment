import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Cloud, AlertCircle, MailCheck, Loader2 } from 'lucide-react';

import { registerSchema } from '../schemas/register.schema';
import { authService } from '../services/auth.service';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');
    try {
      await authService.register(data);
      // Registration succeeded — user must verify email before logging in
      setRegisteredEmail(data.email);
    } catch (error) {
      const apiError = error.response?.data?.error;
      const message =
        apiError?.message ||
        apiError?.issues?.[0]?.message ||
        'An unexpected error occurred. Please try again later.';
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage('');
    try {
      await authService.resendVerification(registeredEmail);
      setResendMessage('Verification email resent! Check your inbox.');
    } catch {
      setResendMessage('Failed to resend. Please try again in a moment.');
    } finally {
      setResendLoading(false);
    }
  };

  // ── Post-registration: show "check your email" state ─────────────────────
  if (registeredEmail) {
    return (
      <Card className="w-full glass-card shadow-lg border-white/30 dark:border-white/10">
        <CardHeader className="space-y-3">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <MailCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <CardTitle className="text-xl text-center font-semibold text-foreground dark:text-white">
            Check your email
          </CardTitle>
          <CardDescription className="text-center text-surface-600 dark:text-surface-400">
            We sent a verification link to
          </CardDescription>
          <p className="text-center text-sm font-semibold text-foreground dark:text-white break-all">
            {registeredEmail}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pb-2">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-md text-sm">
            Click the link in your email to activate your account. The link expires in 24 hours.
          </div>

          {resendMessage && (
            <p className="text-sm text-center text-surface-600 dark:text-surface-400">{resendMessage}</p>
          )}

          <div className="text-center text-sm text-foreground/70 dark:text-surface-400">
            Didn't receive it?{' '}
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-brand-600 hover:text-brand-700 hover:underline font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1"
            >
              {resendLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              Resend verification email
            </button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-0">
          <Separator className="bg-surface-200" />
          <div className="text-sm text-center text-foreground/70 dark:text-surface-400">
            Already verified?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 hover:underline font-medium transition-colors">
              Login here
            </Link>
          </div>
        </CardFooter>
      </Card>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <Card className="w-full glass-card shadow-lg border-white/30 dark:border-white/10">
      <CardHeader className="space-y-3">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
            <Cloud className="w-6 h-6 text-brand-600" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center font-semibold text-foreground dark:text-white">Create Account</CardTitle>
        <CardDescription className="text-center text-surface-600 dark:text-surface-400">
          Sign up to start storing and managing your files.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{serverError}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground dark:text-surface-100 font-medium">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              disabled={isLoading}
              className={errors.name ? 'border-red-500' : ''}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500 font-medium">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground dark:text-surface-100 font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              disabled={isLoading}
              className={errors.email ? 'border-red-500' : ''}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground dark:text-surface-100 font-medium">Password</Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              disabled={isLoading}
              className={errors.password ? 'border-red-500' : ''}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground dark:text-surface-100 font-medium">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              disabled={isLoading}
              className={errors.confirmPassword ? 'border-red-500' : ''}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500 accent-brand-600"
            />
            <Label htmlFor="showPassword" className="text-sm font-normal text-surface-600 dark:text-surface-400 cursor-pointer">
              Show passwords
            </Label>
          </div>
          
          <Button type="submit" className="w-full mt-6 bg-brand-600 hover:bg-brand-700" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Register'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Separator className="bg-surface-200" />
        <div className="text-sm text-center text-foreground/70 dark:text-surface-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 hover:text-brand-700 hover:underline font-medium transition-colors">
            Login here
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
