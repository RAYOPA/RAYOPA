'use client';

import { useRouter } from 'next/navigation';
import { LoginPage as NewLoginPage } from '@/components/ui/sign-in-page';
import { apiFetch } from '@/lib/api/client';
import { setAuthToken, setUser } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (email: string, pass: string) => {
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
  };

  return (
    <NewLoginPage 
      onLogin={handleLogin} 
      onNavigateToSignup={() => router.push('/signup')} 
    />
  );
}
