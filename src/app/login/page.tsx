'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
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
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', pass);

      const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!tokenRes.ok) {
        throw new Error('Invalid credentials');
      }

      const { access_token } = await tokenRes.json();
      setAuthToken(access_token);

      const userRes = await apiFetch<any>('api/auth/me');
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

  return (
    <IntroGate>
      <AuthUI onSignIn={handleSignIn} loading={loading} error={error} />
    </IntroGate>
  );
}
