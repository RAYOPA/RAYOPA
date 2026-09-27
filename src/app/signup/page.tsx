'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUI } from '@/components/ui/auth-ui';
import { setAuthToken, setUser } from '@/lib/auth';

export default function SignUpPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (data: { name: string; email: string; password: string }) => {
    setError('');
    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      
      // 1. Call Backend Signup Endpoint
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

      // 2. Immediately Log In with the newly created credentials
      const formData = new URLSearchParams();
      formData.append('username', data.email.trim());
      formData.append('password', data.password);

      const tokenRes = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!tokenRes.ok) {
        // Redirect to login page if immediate token fetch failed
        router.push('/login');
        return;
      }

      const { access_token } = await tokenRes.json();
      setAuthToken(access_token);

      // 3. Fetch user profile
      const meRes = await fetch(`${apiBase}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      if (meRes.ok) {
        const userData = await meRes.json();
        setUser(userData);
      } else {
        setUser({ id: 'user', username: data.email, role: 'operator' });
      }

      router.push('/');
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
      loading={loading} 
      error={error} 
    />
  );
}
