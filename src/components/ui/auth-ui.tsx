"use client";

import * as React from "react";
import { useState, useId } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, BrainCircuit } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getApiBaseUrl } from "@/lib/api/client";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#8b5cf6] text-white hover:bg-[#7c3aed] shadow-md hover:shadow-lg shadow-purple-500/20 active:scale-[0.99]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 active:scale-[0.99]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-[#8b5cf6] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-1 text-sm shadow-sm transition-all placeholder:text-gray-400 focus-visible:outline-none focus-visible:border-[#8b5cf6] focus-visible:ring-2 focus-visible:ring-[#8b5cf6]/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
    return (
      <div className="relative">
        <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
        <button 
          type="button" 
          onClick={togglePasswordVisibility} 
          className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none" 
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (<EyeOff className="size-4" aria-hidden="true" />) : (<Eye className="size-4" aria-hidden="true" />)}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export interface AuthUIProps {
  initialMode?: 'signin' | 'signup';
  onSignIn?: (e: React.FormEvent<HTMLFormElement>) => void;
  onSignUp?: (data: { name: string; email: string; password: string }) => void;
  onClearError?: () => void;
  loading?: boolean;
  error?: string;
}

export function AuthUI({ 
  initialMode = 'signin', 
  onSignIn, 
  onSignUp, 
  onClearError,
  loading = false, 
  error: externalError 
}: AuthUIProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [internalError, setInternalError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [signUpLoading, setSignUpLoading] = useState<boolean>(false);
  const [demoLoading, setDemoLoading] = useState<boolean>(false);

  // Form input states
  const [signInEmail, setSignInEmail] = useState<string>('');
  const [signInPassword, setSignInPassword] = useState<string>('');
  
  const [signUpName, setSignUpName] = useState<string>('');
  const [signUpEmail, setSignUpEmail] = useState<string>('');
  const [signUpPassword, setSignUpPassword] = useState<string>('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState<string>('');

  const activeError = externalError || internalError;

  const handleDemoLogin = () => {
    setDemoLoading(true);
    const demoUser = { id: 'demo_admin', username: 'admin', role: 'admin' };
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(demoUser));
      localStorage.setItem('auth_token', 'demo_token_admin');
      setTimeout(() => window.location.href = '/', 400);
    }
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setInternalError('');
    setSuccessMessage('');
    if (onClearError) onClearError();
    setMode(newMode);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', newMode === 'signup' ? '/signup' : '/login');
    }
  };

  const handleQuickFill = (emailVal: string, passVal: string) => {
    setSignInEmail(emailVal);
    setSignInPassword(passVal);
    setInternalError('');
    if (onClearError) onClearError();
  };

  const handleTransferToSignUp = () => {
    if (signInEmail) setSignUpEmail(signInEmail);
    if (signInPassword) setSignUpPassword(signInPassword);
    switchMode('signup');
  };

  const handleSignInSubmit = (event: React.FormEvent<HTMLFormElement>) => { 
    setInternalError('');
    setSuccessMessage('');
    if (onClearError) onClearError();
    if (onSignIn) {
      onSignIn(event);
    } else {
      event.preventDefault(); 
    }
  };

  const handleSignUpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInternalError('');
    setSuccessMessage('');
    if (onClearError) onClearError();

    const target = event.currentTarget;
    const name = signUpName || (target.elements.namedItem('name') as HTMLInputElement)?.value || '';
    const email = signUpEmail || (target.elements.namedItem('email') as HTMLInputElement)?.value || '';
    const password = signUpPassword || (target.elements.namedItem('signup-password') as HTMLInputElement)?.value || '';
    const confirmPassword = signUpConfirmPassword || (target.elements.namedItem('confirm-password') as HTMLInputElement)?.value || '';
    const terms = (target.elements.namedItem('terms') as HTMLInputElement)?.checked;

    if (!terms) {
      setInternalError('Please accept the terms and conditions to proceed.');
      return;
    }

    if (password.length < 6) {
      setInternalError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setInternalError('Passwords do not match. Please try again.');
      return;
    }

    if (onSignUp) {
      onSignUp({ name: name.trim(), email: email.trim(), password });
    } else {
      setSignUpLoading(true);
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password, name: name.trim(), role: 'operator' }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Failed to create account.');
        }
        setSuccessMessage('Account created successfully! Switching to sign in...');
        setSignInEmail(email.trim());
        setSignInPassword(password);
        setTimeout(() => {
          switchMode('signin');
        }, 1000);
      } catch (err: any) {
        setInternalError(err.message || 'Failed to create account.');
      } finally {
        setSignUpLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-4 md:p-8">
      <style>{`
        @keyframes gradient-xy {
          0%, 100% {
            background-size: 400% 400%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        .animate-gradient-xy {
          animation: gradient-xy 12s ease infinite;
        }
      `}</style>
      
      <div className="max-w-[960px] w-full bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[640px] transition-all duration-300">
        
        {/* Left Pane - Changing Gradient Background */}
        <div 
          className="hidden md:flex w-1/2 p-12 flex-col justify-between text-white animate-gradient-xy relative transition-all duration-700"
          style={{
            backgroundImage: mode === 'signin' 
              ? "linear-gradient(-45deg, #f59e0b, #d946ef, #8b5cf6, #3b82f6)"
              : "linear-gradient(-45deg, #ec4899, #8b5cf6, #3b82f6, #06b6d4)",
            backgroundSize: "400% 400%"
          }}
        >
          <div className="absolute inset-0 bg-black/5 mix-blend-overlay"></div>
          
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md shadow-inner">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <span className="font-semibold tracking-wide text-sm uppercase text-white/90">Nocode</span>
          </div>
          
          <div className="relative z-10 transition-all duration-500">
            {mode === 'signin' ? (
              <div>
                <h1 className="text-5xl font-bold tracking-tight leading-[1.1] mb-3 text-white/95">
                  Welcome<br/>Back!
                </h1>
                <p className="text-white/80 text-sm max-w-xs font-normal leading-relaxed">
                  Sign in to access your business automation dashboard and active workflows.
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-5xl font-bold tracking-tight leading-[1.1] mb-3 text-white/95">
                  Join Us<br/>Today!
                </h1>
                <p className="text-white/80 text-sm max-w-xs font-normal leading-relaxed">
                  Create your account with any email to unlock automated execution with AI agents.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - Form (Sign In or Sign Up) */}
        <div className="w-full md:w-1/2 p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white">
          <div className="w-full max-w-[360px] mx-auto space-y-5">
            
            {/* Prominent Segmented Mode Selector */}
            <div className="flex p-1 bg-gray-100 rounded-2xl border border-gray-200/80 shadow-inner">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={cn(
                  "flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 text-center flex items-center justify-center gap-1.5",
                  mode === 'signin'
                    ? "bg-white text-gray-900 shadow-sm border border-gray-200/50"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={cn(
                  "flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 text-center flex items-center justify-center gap-1.5",
                  mode === 'signup'
                    ? "bg-white text-gray-900 shadow-sm border border-gray-200/50"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <span>Create Account (Sign Up)</span>
              </button>
            </div>

            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-[26px] font-bold text-gray-900 tracking-tight">
                {mode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {mode === 'signin' ? (
                  <>
                    Don't have an account?{" "}
                    <button 
                      type="button" 
                      onClick={() => switchMode('signup')}
                      className="text-[#8b5cf6] hover:text-[#7c3aed] hover:underline font-semibold transition-colors"
                    >
                      Sign up for free
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button 
                      type="button" 
                      onClick={() => switchMode('signin')}
                      className="text-[#8b5cf6] hover:text-[#7c3aed] hover:underline font-semibold transition-colors"
                    >
                      Sign in here
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* Error Notification with helpful quick action */}
            {activeError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex flex-col gap-1.5 text-xs sm:text-sm font-medium animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{activeError}</span>
                </div>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={handleTransferToSignUp}
                    className="text-xs text-[#7c3aed] font-bold underline hover:text-[#6d28d9] text-left pt-0.5"
                  >
                    Need an account? Click here to register with this email →
                  </button>
                )}
              </div>
            )}

            {/* Success Notification */}
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-medium animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            {mode === 'signin' ? (
              <form className="space-y-4" onSubmit={handleSignInSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="text" 
                    placeholder="e.g. name@example.com" 
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <PasswordInput 
                    id="password" 
                    name="password" 
                    placeholder="Enter your password" 
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required 
                  />
                </div>
                
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="remember" 
                      defaultChecked
                      className="h-4 w-4 rounded border-gray-300 text-[#8b5cf6] focus:ring-[#8b5cf6] cursor-pointer" 
                    />
                    <Label htmlFor="remember" className="text-xs sm:text-sm font-normal text-gray-600 cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <button type="button" className="text-xs sm:text-sm text-[#8b5cf6] hover:underline font-medium">
                    Forgot password?
                  </button>
                </div>
                
                <Button type="submit" className="w-full mt-2 text-base font-semibold" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Authenticating...</> : "Sign In"}
                </Button>

                {/* Pre-seeded Quick Demo Accounts */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                    <span>Quick Demo Logins (Click to fill)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleQuickFill('demo@nocode.ai', 'password123')}
                      className="px-2.5 py-1.5 rounded-lg border border-purple-100 bg-purple-50/50 hover:bg-purple-100/70 text-purple-700 font-medium text-left truncate transition-colors flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      demo@nocode.ai
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('admin@nocode.ai', 'admin123')}
                      className="px-2.5 py-1.5 rounded-lg border border-purple-100 bg-purple-50/50 hover:bg-purple-100/70 text-purple-700 font-medium text-left truncate transition-colors flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      admin@nocode.ai
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('operator@nocode.ai', 'password123')}
                      className="px-2.5 py-1.5 rounded-lg border border-purple-100 bg-purple-50/50 hover:bg-purple-100/70 text-purple-700 font-medium text-left truncate transition-colors flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      operator@nocode.ai
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('mayank@nocode.ai', 'password123')}
                      className="px-2.5 py-1.5 rounded-lg border border-purple-100 bg-purple-50/50 hover:bg-purple-100/70 text-purple-700 font-medium text-left truncate transition-colors flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      mayank@nocode.ai
                    </button>
                  </div>
                </div>

                {/* Instant Demo Access (no backend needed) */}
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={demoLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-[#8b5cf6]/40 text-[#7c3aed] text-xs font-semibold hover:border-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all duration-200 disabled:opacity-60"
                >
                  {demoLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Entering dashboard...</> : '⚡ Enter as Demo Admin (instant bypass)'}
                </button>
                
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-100" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-gray-400">or continue with</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <Button variant="outline" type="button" className="w-full text-gray-700 font-medium text-xs shadow-sm h-9">
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </Button>
                  <Button variant="outline" type="button" className="w-full text-gray-700 font-medium text-xs shadow-sm h-9">
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                    GitHub
                  </Button>
                </div>
              </form>
            ) : (
              <form className="space-y-3.5" onSubmit={handleSignUpSubmit}>
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-gray-700 font-medium text-xs sm:text-sm">Full Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    type="text" 
                    placeholder="e.g. Mayank Sharma" 
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-gray-700 font-medium text-xs sm:text-sm">Email Address</Label>
                  <Input 
                    id="signup-email" 
                    name="email" 
                    type="email" 
                    placeholder="e.g. yourname@gmail.com" 
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required 
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-gray-700 font-medium text-xs sm:text-sm">Password</Label>
                  <PasswordInput 
                    id="signup-password" 
                    name="signup-password" 
                    placeholder="At least 6 characters" 
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirm-password" className="text-gray-700 font-medium text-xs sm:text-sm">Confirm Password</Label>
                  <PasswordInput 
                    id="confirm-password" 
                    name="confirm-password" 
                    placeholder="Re-enter password" 
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    required 
                  />
                </div>
                
                <div className="flex items-start space-x-2 pt-0.5">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    name="terms" 
                    defaultChecked
                    className="h-4 w-4 mt-0.5 rounded border-gray-300 text-[#8b5cf6] focus:ring-[#8b5cf6] cursor-pointer" 
                  />
                  <Label htmlFor="terms" className="text-[11px] sm:text-xs font-normal text-gray-500 leading-tight cursor-pointer">
                    I agree to the <span className="text-[#8b5cf6] hover:underline">Terms of Service</span> and <span className="text-[#8b5cf6] hover:underline">Privacy Policy</span>
                  </Label>
                </div>
                
                <Button type="submit" className="w-full mt-2 text-sm sm:text-base font-semibold" disabled={signUpLoading || loading}>
                  {signUpLoading || loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating Account...</> : "Create Account & Sign In"}
                </Button>

                {/* Instant Demo Access (no backend needed) */}
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={demoLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-[#8b5cf6]/40 text-[#7c3aed] text-xs font-semibold hover:border-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all duration-200 disabled:opacity-60"
                >
                  {demoLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Entering dashboard...</> : '⚡ Or enter as Demo Admin immediately'}
                </button>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
