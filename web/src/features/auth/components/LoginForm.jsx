import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Cloud, AlertCircle, MailCheck, Loader2 } from 'lucide-react';

import { loginSchema } from '../schemas/login.schema';
import { authService } from '../services/auth.service';
import { useAuthStore } from '@/store';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');
    setUnverifiedEmail('');
    setResendMessage('');
    try {
      const response = await authService.login(data);
      setAuth(response.user, response.accessToken);
      navigate('/explorer', { replace: true });
    } catch (error) {
      const apiError = error.response?.data?.error;
      if (apiError?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(getValues('email'));
      } else {
        const message =
          apiError?.message ||
          apiError?.issues?.[0]?.message ||
          'An unexpected error occurred. Please try again later.';
        setServerError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage('');
    try {
      await authService.resendVerification(unverifiedEmail);
      setResendMessage('Verification email sent! Check your inbox.');
    } catch {
      setResendMessage('Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Card className="w-full glass-card shadow-lg border-white/30 dark:border-white/10">
      <CardHeader className="space-y-3">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
            <Cloud className="w-6 h-6 text-brand-600" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center font-semibold text-foreground dark:text-white">Welcome back</CardTitle>
        <CardDescription className="text-center text-surface-600 dark:text-surface-400">
          Enter your email and password to access your files.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{serverError}</p>
            </div>
          )}
          {unverifiedEmail && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md text-sm">
              <div className="flex items-start gap-2 mb-2">
                <MailCheck className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-amber-700 dark:text-amber-300">
                  Please verify your email address before logging in.
                </p>
              </div>
              {resendMessage ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 pl-6">{resendMessage}</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="pl-6 text-xs text-amber-700 dark:text-amber-300 hover:underline font-medium inline-flex items-center gap-1 disabled:opacity-50"
                >
                  {resendLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Resend verification email
                </button>
              )}
            </div>
          )}
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground dark:text-surface-100 font-medium">Password</Label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
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
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500 accent-brand-600"
              />
              <Label htmlFor="showPassword" className="text-sm font-normal text-surface-600 dark:text-surface-400 cursor-pointer">
                Show password
              </Label>
            </div>
          </div>
          
          <Button type="submit" className="w-full mt-6 bg-brand-600 hover:bg-brand-700" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Separator className="bg-surface-200" />
        <div className="text-sm text-center text-foreground/70 dark:text-surface-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 hover:text-brand-700 hover:underline font-medium transition-colors">
            Register here
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
