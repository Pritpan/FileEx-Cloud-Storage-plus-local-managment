import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Cloud, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

import api from '@/lib/axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setServerError('No reset token was found in the link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    
    if (newPassword !== confirmPassword) {
      setServerError('New passwords do not match.');
      return;
    }
    
    if (newPassword.length < 8) {
      setServerError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    setServerError('');
    
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
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
          {success ? (
             <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
               <CheckCircle2 className="w-6 h-6 text-emerald-600" />
             </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
              <Cloud className="w-6 h-6 text-brand-600" />
            </div>
          )}
        </div>
        <CardTitle className="text-2xl text-center font-semibold text-foreground dark:text-white">
          {success ? 'Password Reset!' : 'Choose New Password'}
        </CardTitle>
        <CardDescription className="text-center text-surface-600 dark:text-surface-400">
          {success 
            ? 'Your password has been successfully updated.' 
            : 'Enter your new password below.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {success ? (
          <div className="text-center py-4 space-y-4">
            <p className="text-sm text-surface-600 dark:text-surface-400 mb-6">
              You can now log in to your FileEX account using your new password. All of your existing sessions have been signed out for security.
            </p>
            <Button asChild className="w-full bg-brand-600 hover:bg-brand-700">
              <Link to="/login">Go to Login</Link>
            </Button>
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
              <Label htmlFor="password" className="text-foreground dark:text-surface-100 font-medium">New Password</Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading || !token}
                required
                minLength={8}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground dark:text-surface-100 font-medium">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading || !token}
                required
                minLength={8}
              />
            </div>
            
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500 accent-brand-600"
                disabled={!token}
              />
              <Label htmlFor="showPassword" className="text-sm font-normal text-surface-600 dark:text-surface-400 cursor-pointer">
                Show passwords
              </Label>
            </div>
            
            <Button type="submit" className="w-full mt-6 bg-brand-600 hover:bg-brand-700" disabled={isLoading || !token}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : 'Reset Password'}
            </Button>
          </form>
        )}
      </CardContent>
      
      {!success && (
        <CardFooter className="flex flex-col space-y-4">
          <Separator className="bg-surface-200" />
          <div className="text-sm text-center">
             <Link to="/forgot-password" className="text-brand-600 hover:text-brand-700 hover:underline font-medium transition-colors">
               Request a new link
             </Link>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
