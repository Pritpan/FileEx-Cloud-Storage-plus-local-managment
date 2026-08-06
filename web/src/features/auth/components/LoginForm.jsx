import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Cloud, AlertCircle } from 'lucide-react';

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
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
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
    try {
      const response = await authService.login(data);
      setAuth(response.user, response.accessToken);
      navigate('/explorer', { replace: true });
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

  return (
    <Card className="w-full shadow-lg border-surface-200">
      <CardHeader className="space-y-3">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
            <Cloud className="w-6 h-6 text-brand-600" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center font-semibold text-surface-900">Welcome back</CardTitle>
        <CardDescription className="text-center text-surface-500">
          Enter your email and password to access your files.
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
            <Label htmlFor="email" className="text-surface-800">Email</Label>
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
            <Label htmlFor="password" className="text-surface-800">Password</Label>
            <Input
              id="password"
              type="password"
              disabled={isLoading}
              className={errors.password ? 'border-red-500' : ''}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full mt-6 bg-brand-600 hover:bg-brand-700" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Separator className="bg-surface-200" />
        <div className="text-sm text-center text-surface-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 hover:text-brand-700 hover:underline font-medium transition-colors">
            Register here
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
