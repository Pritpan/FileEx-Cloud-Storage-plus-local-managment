import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cloud, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/axios';
import { AUTH } from '@/constants/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setServerError('');
    
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      toast.success(response.data.message || 'Reset link sent');
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
    <Card className="w-full glass-card shadow-lg border-white/30 dark:border-white/10">
      <CardHeader className="space-y-3">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
            <Cloud className="w-6 h-6 text-brand-600" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center font-semibold text-foreground dark:text-white">Reset Password</CardTitle>
        <CardDescription className="text-center text-surface-600 dark:text-surface-400">
          Enter your email address and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="p-4 bg-brand-50 border border-brand-200 text-brand-700 dark:bg-brand-900/20 dark:border-brand-800 dark:text-brand-300 rounded-md text-sm font-medium">
              If an account exists for this email, you'll receive a password reset link shortly.
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400">
              Please check your inbox and spam folder.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {serverError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{serverError}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground dark:text-surface-100 font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <Button type="submit" className="w-full mt-6 bg-brand-600 hover:bg-brand-700" disabled={isLoading || !email}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : 'Send Reset Link'}
            </Button>
          </form>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4">
        <Separator className="bg-surface-200" />
        <div className="text-sm text-center">
          <Link to="/login" className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 hover:underline font-medium transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
