'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUI } from '@/components/ui/auth-ui';
import { setAuthToken, setUser } from '@/lib/auth';
import { getApiBaseUrl, apiFetch } from '@/lib/api/client';

export default function SignUpPage() {
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const performLogin = async (email: string, pass: string) => {
    setLoading(true);
    setError(undefined);
    try {
      const apiBase = getApiBaseUrl();
      const formData = new URLSearchParams();
      formData.append('username', email.trim());
      formData.append('password', pass);

      const tokenRes = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!tokenRes.ok) {
        const errJson = await tokenRes.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Incorrect email or password. Please try again.');
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

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    const email = (target.elements.namedItem('email') as HTMLInputElement)?.value ?? '';
    const pass = (target.elements.namedItem('password') as HTMLInputElement)?.value ?? '';
    await performLogin(email, pass);
  };

  const handleSignUp = async (data: { name: string; email: string; password: string }) => {
    setError(undefined);
    setLoading(true);

    try {
      const apiBase = getApiBaseUrl();
      
      const signupRes = await fetch(`${apiBase}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email.trim(),
          password: data.password,
          name: data.name.trim(),
          role: 'operator'
        })
      });

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
    <AuthUI 
      initialMode="signup" 
      onSignUp={handleSignUp}
      onSignIn={handleSignIn}
      onClearError={() => setError(undefined)}
      loading={loading} 
      error={error} 
    />
  );
}
