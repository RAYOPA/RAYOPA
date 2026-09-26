import React, { useState } from 'react'
import { Eye, EyeOff, BrainCircuit } from 'lucide-react'
import { sound } from '../../utils/audio'

interface SignInPageProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  onNavigateToSignup: () => void;
}

export function LoginPage({ onLogin, onNavigateToSignup }: SignInPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [googleStatus, setGoogleStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'cancelled'>('idle')
  const [githubStatus, setGithubStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'cancelled'>('idle')
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

  const [errorMsg, setErrorMsg] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setErrorMsg('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    sound.playClick()
    
    if (formData.email.length < 1) {
      setErrorMsg('Username or email is required')
      return
    }
    
    if (formData.password.length < 1) {
      setErrorMsg('Invalid email or password.')
      return
    }

    setFormStatus('loading')
    setErrorMsg('')
    try {
      await onLogin(formData.email, formData.password)
      setFormStatus('success')
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed')
      setFormStatus('error')
    }
  }

  const handleGoogleLogin = () => {
    if (googleStatus === 'loading' || githubStatus === 'loading') return;
    sound.playClick()
    setGoogleStatus('loading')
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    window.location.href = `${apiUrl}/api/auth/google`
  }

  const handleGithubLogin = () => {
    if (googleStatus === 'loading' || githubStatus === 'loading') return;
    sound.playClick()
    setGithubStatus('loading')
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    window.location.href = `${apiUrl}/api/auth/github`
  }

  return (
    <div className="h-screen w-screen bg-slate-50 flex items-center justify-center font-sans">
      <div className="flex h-[600px] w-[1000px] max-w-full overflow-hidden rounded-3xl bg-white shadow-2xl shadow-indigo-500/10 border border-slate-100">
        
        {/* Left Panel - Animated Background (Welcome Back as requested) */}
        <div className="relative flex w-1/2 flex-col justify-center overflow-hidden bg-indigo-600 p-12 text-white login-gradient-bg">
          {/* Glassmorphism abstract shapes */}
          <div className="absolute -left-[20%] top-[10%] h-[500px] w-[500px] rounded-full bg-purple-500/40 mix-blend-multiply blur-[80px] animate-blob"></div>
          <div className="absolute -right-[20%] bottom-[10%] h-[500px] w-[500px] rounded-full bg-orange-400/40 mix-blend-multiply blur-[80px] animate-blob animation-delay-2000"></div>
          <div className="absolute left-[20%] -bottom-[20%] h-[500px] w-[500px] rounded-full bg-indigo-400/40 mix-blend-multiply blur-[80px] animate-blob animation-delay-4000"></div>

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <BrainCircuit className="w-8 h-8 text-white/90" />
            </div>
            
            <div className="mt-auto pb-12">
              <h1 className="text-6xl font-extrabold leading-tight tracking-tight drop-shadow-md">
                Welcome<br />
                Back!
              </h1>
            </div>
          </div>
        </div>

        {/* Right Panel - Form Section from the provided component */}
        <div className="flex-1 flex items-center justify-center bg-white relative">
          <div className="w-full max-w-md p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick()
                    onNavigateToSignup()
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  Sign up
                </button>
              </p>
            </div>

              {errorMsg && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
                  {errorMsg}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username or Email
                </label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Username or Email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 text-sm text-gray-900"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 text-sm text-gray-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me + Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={formStatus === 'loading'}
                className="w-full bg-[#8B5CF6] text-white py-3 px-4 rounded-xl font-bold shadow-lg shadow-purple-500/30 hover:bg-purple-600 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
              >
                {formStatus === 'loading' ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">or continue with</span>
                </div>
              </div>

              {/* Social Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleStatus === 'loading' || githubStatus === 'loading'}
                  className="w-full flex items-center justify-center px-4 h-12 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {/* Google SVG */}
                  <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">
                    {googleStatus === 'loading' ? 'Connecting to Google...' : 'Continue with Google'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleGithubLogin}
                  disabled={googleStatus === 'loading' || githubStatus === 'loading'}
                  className="w-full flex items-center justify-center px-4 h-12 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {/* GitHub SVG */}
                  <svg className="w-5 h-5 mr-3 shrink-0" fill="#24292f" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">
                    {githubStatus === 'loading' ? 'Connecting to GitHub...' : 'Continue with GitHub'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
