'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { setAuthToken, setUser } from '@/lib/auth';
import { AuthUI } from '@/components/ui/auth-ui';
import { IntroGate } from '@/components/intro/FlowPilotIntro';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', pass);

      const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
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

  return (
    <IntroGate>
      <AuthUI onSignIn={handleLogin} loading={loading} error={error} />
    </IntroGate>
  );
}
