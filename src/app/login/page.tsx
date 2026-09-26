'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { setAuthToken, setUser } from '@/lib/auth';
import { AuthUI } from '@/components/ui/auth-ui';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const target = e.target as typeof e.target & {
        email: { value: string };
        password: { value: string };
      };
      
      const username = target.email.value;
      const password = target.password.value;

      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

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
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return <AuthUI onSignIn={handleLogin} loading={loading} error={error} />;
}
