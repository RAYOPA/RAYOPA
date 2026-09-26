"use client";

import * as React from "react";
import { useState, useId } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, BrainCircuit } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
  loading?: boolean;
  error?: string;
}

export function AuthUI({ 
  initialMode = 'signin', 
  onSignIn, 
  onSignUp, 
  loading = false, 
  error: externalError 
}: AuthUIProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [internalError, setInternalError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [signUpLoading, setSignUpLoading] = useState<boolean>(false);

  const activeError = externalError || internalError;

  const switchMode = (newMode: 'signin' | 'signup') => {
    setInternalError('');
    setSuccessMessage('');
    setMode(newMode);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', newMode === 'signup' ? '/signup' : '/login');
    }
  };

  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => { 
    setInternalError('');
    setSuccessMessage('');
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

    const target = event.currentTarget;
    const name = (target.elements.namedItem('name') as HTMLInputElement)?.value || '';
    const email = (target.elements.namedItem('email') as HTMLInputElement)?.value || '';
    const password = (target.elements.namedItem('signup-password') as HTMLInputElement)?.value || '';
    const confirmPassword = (target.elements.namedItem('confirm-password') as HTMLInputElement)?.value || '';
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
      onSignUp({ name, email, password });
    } else {
      setSignUpLoading(true);
      setTimeout(() => {
        setSignUpLoading(false);
        setSuccessMessage('Account created successfully! You can now sign in.');
        setTimeout(() => {
          switchMode('signin');
        }, 1200);
      }, 800);
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
      
      <div className="max-w-[960px] w-full bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[620px] transition-all duration-300">
        
        {/* Left Pane - Changing Gradient Background */}
        <div 
          className="hidden md:flex w-1/2 p-12 flex-col justify-between text-white animate-gradient-xy relative transition-all duration-700"
          style={{
            background: mode === 'signin' 
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
            <span className="font-semibold tracking-wide text-sm uppercase text-white/90">FlowPilot</span>
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
                  Create your account in seconds and unlock automated execution with AI agents.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - Form (Sign In or Sign Up) */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="w-full max-w-[350px] mx-auto space-y-6">
            
            {/* Header */}
            <div className="space-y-1.5">
              <h2 className="text-[28px] font-bold text-gray-900 tracking-tight">
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-sm text-gray-500">
                {mode === 'signin' ? (
                  <>
                    Don't have an account?{" "}
                    <button 
                      type="button" 
                      onClick={() => switchMode('signup')}
                      className="text-[#8b5cf6] hover:text-[#7c3aed] hover:underline font-semibold transition-colors"
                    >
                      Sign up
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
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* Error Notification */}
            {activeError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{activeError}</span>
              </div>
            )}

            {/* Success Notification */}
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            {mode === 'signin' ? (
              <form className="space-y-4" onSubmit={handleSignIn}>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                  <Input id="email" name="email" type="text" placeholder="Email Address" required />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <PasswordInput id="password" name="password" placeholder="Password" required />
                </div>
                
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="remember" 
                      className="h-4 w-4 rounded border-gray-300 text-[#8b5cf6] focus:ring-[#8b5cf6] cursor-pointer" 
                    />
                    <Label htmlFor="remember" className="text-sm font-normal text-gray-600 cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <button type="button" className="text-sm text-[#8b5cf6] hover:underline font-medium">
                    Forgot password?
                  </button>
                </div>
                
                <Button type="submit" className="w-full mt-2 text-base font-semibold" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Authenticating...</> : "Sign In"}
                </Button>
                
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-100" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-gray-400">or</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" type="button" className="w-full text-gray-700 font-medium text-[13px] shadow-sm">
                    <svg className="w-[18px] h-[18px] mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </Button>
                  <Button variant="outline" type="button" className="w-full text-gray-700 font-medium text-[13px] shadow-sm">
                    <svg className="w-[18px] h-[18px] mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                    GitHub
                  </Button>
                </div>
              </form>
            ) : (
              <form className="space-y-3.5" onSubmit={handleSignUpSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
                  <Input id="name" name="name" type="text" placeholder="John Doe" required />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-gray-700 font-medium">Email Address</Label>
                  <Input id="signup-email" name="email" type="email" placeholder="name@example.com" required />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-gray-700 font-medium">Password</Label>
                  <PasswordInput id="signup-password" name="signup-password" placeholder="At least 6 characters" required />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-gray-700 font-medium">Confirm Password</Label>
                  <PasswordInput id="confirm-password" name="confirm-password" placeholder="Confirm password" required />
                </div>
                
                <div className="flex items-start space-x-2 pt-1">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    name="terms" 
                    defaultChecked
                    className="h-4 w-4 mt-0.5 rounded border-gray-300 text-[#8b5cf6] focus:ring-[#8b5cf6] cursor-pointer" 
                  />
                  <Label htmlFor="terms" className="text-xs font-normal text-gray-500 leading-tight cursor-pointer">
                    I agree to the <span className="text-[#8b5cf6] hover:underline">Terms of Service</span> and <span className="text-[#8b5cf6] hover:underline">Privacy Policy</span>
                  </Label>
                </div>
                
                <Button type="submit" className="w-full mt-2 text-base font-semibold" disabled={signUpLoading || loading}>
                  {signUpLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating Account...</> : "Sign Up"}
                </Button>
                
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-100" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-gray-400">or</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" type="button" className="w-full text-gray-700 font-medium text-[13px] shadow-sm">
                    <svg className="w-[18px] h-[18px] mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </Button>
                  <Button variant="outline" type="button" className="w-full text-gray-700 font-medium text-[13px] shadow-sm">
                    <svg className="w-[18px] h-[18px] mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                    GitHub
                  </Button>
                </div>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
