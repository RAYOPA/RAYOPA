'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUI } from '@/components/ui/auth-ui';

export default function SignUpPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (data: { name: string; email: string; password: string }) => {
    setError('');
    setLoading(true);

    try {
      // Demo credentials & local storage setup for seamless preview
      const demoUser = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        username: data.email.split('@')[0] || data.name,
        role: 'operator',
        name: data.name,
        email: data.email
      };
      
      localStorage.setItem('user', JSON.stringify(demoUser));
      localStorage.setItem('auth_token', 'demo_token_' + Date.now());

      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
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
