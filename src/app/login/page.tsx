'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getApiBaseUrl } from '@/lib/api/client';
import { setAuthToken, setUser } from '@/lib/auth';
import { AuthUI } from '@/components/ui/auth-ui';
import { IntroGate } from '@/components/intro/FlowPilotIntro';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // error matches AuthUIProps (string | undefined)
  const [error, setError] = useState<string | undefined>(undefined);

  /** Perform login with raw credentials */
  const performLogin = async (email: string, pass: string) => {
    setLoading(true);
    setError(undefined);
    try {
      const apiBase = getApiBaseUrl();
      const formData = new URLSearchParams();
      formData.append('username', email.trim());
      formData.append('password', pass);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      let tokenRes: Response;
      try {
        tokenRes = await fetch(`${apiBase}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
          signal: controller.signal,
        });
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          throw new Error('Server request timed out. Please try again or use Demo Admin.');
        }
        throw new Error('Cannot reach backend server. Please verify connection or use Demo Admin.');
      } finally {
        clearTimeout(timeoutId);
      }

      if (!tokenRes.ok) {
        const errJson = await tokenRes.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Incorrect email or password. If you do not have an account, switch to Create Account above.');
      }

      const { access_token } = await tokenRes.json();
      setAuthToken(access_token);

      const userRes = await apiFetch<any>('/api/auth/me');
      setUser(userRes);

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  /** Wrapper matching AuthUI onSignIn signature */
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    const email = (target.elements.namedItem('email') as HTMLInputElement)?.value ?? '';
    const pass = (target.elements.namedItem('password') as HTMLInputElement)?.value ?? '';
    await performLogin(email, pass);
  };

  /** Wrapper matching AuthUI onSignUp signature */
  const handleSignUp = async (data: { name: string; email: string; password: string }) => {
    setLoading(true);
    setError(undefined);
    try {
      const apiBase = getApiBaseUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      let signupRes: Response;
      try {
        signupRes = await fetch(`${apiBase}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email.trim(),
            password: data.password,
            name: data.name.trim(),
            role: 'operator'
          }),
          signal: controller.signal,
        });
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          throw new Error('Connection timed out while creating account. Please try again.');
        }
        throw new Error('Cannot reach backend server. Please try again or use Demo Admin.');
      } finally {
        clearTimeout(timeoutId);
      }

      if (!signupRes.ok) {
        const errorData = await signupRes.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create account.');
      }

      await performLogin(data.email.trim(), data.password);
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IntroGate>
      <AuthUI 
        onSignIn={handleSignIn} 
        onSignUp={handleSignUp} 
        onClearError={() => setError(undefined)}
        loading={loading} 
        error={error} 
      />
    </IntroGate>
  );
}
