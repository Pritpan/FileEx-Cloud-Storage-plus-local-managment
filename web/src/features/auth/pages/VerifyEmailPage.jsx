import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, MailCheck } from 'lucide-react';

import { authService } from '../services/auth.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * VerifyEmailPage
 *
 * Handles the GET /verify-email?token=... flow.
 * Mounted at /verify-email in the public route zone.
 */
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token was found in the link. Please check your email and try again.');
      return;
    }

    let cancelled = false;

    authService
      .verifyEmail(token)
      .then(() => {
        if (!cancelled) {
          setStatus('success');
          setMessage('Your email has been verified successfully. You can now log in to FileEX.');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus('error');
          const code = err.response?.data?.error?.code;
          const msg  = err.response?.data?.error?.message;

          if (code === 'TOKEN_EXPIRED') {
            setMessage('This verification link has expired. Please request a new one from the login page.');
          } else if (code === 'TOKEN_ALREADY_USED') {
            setMessage('This verification link has already been used. Your account may already be verified — try logging in.');
          } else {
            setMessage(msg || 'This verification link is invalid or has already been used.');
          }
        }
      });

    return () => { cancelled = true; };
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'transparent' }}>
      <div className="w-full max-w-sm">
        <Card className="glass-card shadow-lg border-white/30 dark:border-white/10">
          <CardHeader className="space-y-3 text-center">
            <div className="flex justify-center">
              {status === 'loading' && (
                <div className="w-14 h-14 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-brand-600 dark:text-brand-400 animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
              )}
              {status === 'error' && (
                <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="w-7 h-7 text-red-500 dark:text-red-400" />
                </div>
              )}
            </div>

            <CardTitle className="text-xl font-semibold text-foreground dark:text-white">
              {status === 'loading' && 'Verifying your email…'}
              {status === 'success' && 'Email verified!'}
              {status === 'error'   && 'Verification failed'}
            </CardTitle>

            <CardDescription className="text-sm text-surface-600 dark:text-surface-400">
              {status === 'loading' && 'Please wait while we verify your email address.'}
              {message && message}
            </CardDescription>
          </CardHeader>

          <CardContent />

          {status !== 'loading' && (
            <CardFooter className="flex flex-col gap-3">
              {status === 'success' && (
                <Button asChild className="w-full bg-brand-600 hover:bg-brand-700">
                  <Link to="/login">Go to Login</Link>
                </Button>
              )}
              {status === 'error' && (
                <>
                  <Button asChild className="w-full bg-brand-600 hover:bg-brand-700">
                    <Link to="/login">Back to Login</Link>
                  </Button>
                  <p className="text-xs text-center text-surface-500 dark:text-surface-400">
                    Need a new link?{' '}
                    <Link to="/register" className="text-brand-600 hover:underline font-medium">
                      Register again
                    </Link>{' '}
                    or use the resend option on the registration confirmation screen.
                  </p>
                </>
              )}
            </CardFooter>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-surface-500 dark:text-surface-400">
          <MailCheck className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
          FileEX — secure cloud file storage
        </p>
      </div>
    </div>
  );
}
