"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 100,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    );

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    isDeleting,
    currentText,
    loop,
    speed,
    deleteSpeed,
    delay,
    displayText,
    text,
  ]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">{cursor}</span>
    </span>
  );
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
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-emerald-700 text-white hover:bg-emerald-800",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input dark:border-input/50 bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-emerald-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6",
        icon: "h-8 w-8",
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
          "flex h-10 w-full rounded-lg border border-input dark:border-input/50 bg-background px-3 py-3 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:border-emerald-600 focus-visible:ring-1 focus-visible:ring-emerald-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
    return (
      <div className="grid w-full items-center gap-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
          <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? (<EyeOff className="size-4" aria-hidden="true" />) : (<Eye className="size-4" aria-hidden="true" />)}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

interface SignInFormProps {
  onSignIn?: (e: React.FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
  error?: string;
}

function SignInForm({ onSignIn, loading, error }: SignInFormProps) {
  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => { 
    if (onSignIn) {
      onSignIn(event);
    } else {
      event.preventDefault(); 
      console.log("UI: Sign In form submitted"); 
    }
  };
  return (
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-6 w-full">
      <div className="flex flex-col items-center gap-2 text-center mb-2">
        <h1 className="text-3xl font-bold text-[#12372A] tracking-tight">Welcome Back</h1>
        <p className="text-balance text-sm text-[#436850]">Enter your username or email below</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 w-full">
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-[#12372A]">Username</Label>
          <Input id="email" name="email" type="text" placeholder="e.g. admin" required autoComplete="username" className="bg-white/50" />
        </div>
        <PasswordInput name="password" label="Password" required autoComplete="current-password" placeholder="Password" className="bg-white/50" />
        <Button type="submit" className="mt-4 w-full shadow-md" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Authenticating...</> : "Sign In"}
        </Button>
      </div>
    </form>
  );
}

import { PasswordStrength } from "@/components/ui/password-strength";

function SignUpForm() {
  const [password, setPassword] = useState("");
  const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); console.log("UI: Sign Up form submitted"); };
  
  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-6 w-full">
      <div className="flex flex-col items-center gap-2 text-center mb-2">
        <h1 className="text-3xl font-bold text-[#12372A] tracking-tight">Create an account</h1>
        <p className="text-balance text-sm text-[#436850]">Enter your details below to sign up</p>
      </div>
      <div className="grid gap-4 w-full">
        <div className="grid gap-1"><Label htmlFor="name" className="text-[#12372A]">Full Name</Label><Input id="name" name="name" type="text" placeholder="John Doe" required autoComplete="name" className="bg-white/50" /></div>
        <div className="grid gap-2"><Label htmlFor="email" className="text-[#12372A]">Email</Label><Input id="email" name="email" type="email" placeholder="m@example.com" required autoComplete="email" className="bg-white/50" /></div>
        
        <div className="grid w-full items-center gap-2 dark bg-[#1D1D1A] p-5 rounded-2xl shadow-xl mt-2">
          <Label htmlFor="signup-password" className="text-[13px] font-medium text-stone-200">New password</Label>
          <div className="relative">
            <input
              id="signup-password"
              type="password"
              value={password}
              autoComplete="new-password"
              spellCheck={false}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Type a password"
              className="mt-1.5 h-10 w-full rounded-[10px] border-2 border-white/[0.08] bg-[#252522] px-3 text-[13px] text-stone-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)] outline-none transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-stone-500 focus:border-[#93B0FF] focus:bg-[#252522] focus:shadow-none focus-visible:outline-none"
            />
          </div>
          {password.length > 0 && (
            <div className="mt-2">
              <PasswordStrength value={password} />
            </div>
          )}
        </div>
        
        <Button type="submit" className="mt-4 w-full shadow-md">Sign Up</Button>
      </div>
    </form>
  );
}

interface AuthFormContainerProps {
  isSignIn: boolean;
  onToggle: () => void;
  onSignIn?: (e: React.FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
  error?: string;
}

function AuthFormContainer({ isSignIn, onToggle, onSignIn, loading, error }: AuthFormContainerProps) {
    return (
        <div className="w-full max-w-sm flex flex-col items-center justify-center px-4">
            <div className="w-full flex justify-center">
              {isSignIn ? <SignInForm onSignIn={onSignIn} loading={loading} error={error} /> : <SignUpForm />}
            </div>
            
            <div className="w-full text-center text-sm mt-6 mb-2">
                <span className="text-[#436850]">
                  {isSignIn ? "Don't have an account?" : "Already have an account?"}
                </span>{" "}
                <Button variant="link" className="pl-1 text-[#12372A] font-bold" onClick={onToggle}>
                    {isSignIn ? "Sign up" : "Sign in"}
                </Button>
            </div>
            
            {isSignIn && (
              <div className="w-full mt-4 p-5 bg-[#ADBC9F]/10 rounded-2xl border border-[#ADBC9F]/30 flex flex-col items-center text-center shadow-inner">
                <p className="text-[10px] font-bold text-[#436850] uppercase tracking-widest mb-3">Demo Credentials</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="text-xs bg-white text-[#12372A] px-3 py-1.5 rounded-lg border border-[#ADBC9F]/40 shadow-sm font-semibold cursor-default hover:bg-slate-50 transition-colors">admin</span>
                  <span className="text-xs bg-white text-[#12372A] px-3 py-1.5 rounded-lg border border-[#ADBC9F]/40 shadow-sm font-semibold cursor-default hover:bg-slate-50 transition-colors">operator</span>
                  <span className="text-xs bg-white text-[#12372A] px-3 py-1.5 rounded-lg border border-[#ADBC9F]/40 shadow-sm font-semibold cursor-default hover:bg-slate-50 transition-colors">viewer</span>
                </div>
              </div>
            )}
        </div>
    )
}

interface AuthContentProps {
    image?: {
        src: string;
        alt: string;
    };
    quote?: {
        text: string;
        author: string;
    }
}

export interface AuthUIProps {
    signInContent?: AuthContentProps;
    signUpContent?: AuthContentProps;
    onSignIn?: (e: React.FormEvent<HTMLFormElement>) => void;
    loading?: boolean;
    error?: string;
}

const defaultSignInContent = {
    image: {
        src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop",
        alt: "A beautiful interior design for sign-in"
    },
    quote: {
        text: "Orchestrating Business Intent into Autonomous Action.",
        author: "FlowPilot AI"
    }
};

const defaultSignUpContent = {
    image: {
        src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop",
        alt: "A vibrant, modern space for new beginnings"
    },
    quote: {
        text: "Create an account. A new chapter awaits.",
        author: "FlowPilot AI"
    }
};

export function AuthUI({ signInContent = {}, signUpContent = {}, onSignIn, loading, error }: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(true);
  const toggleForm = () => setIsSignIn((prev) => !prev);

  const finalSignInContent = {
      image: { ...defaultSignInContent.image, ...signInContent.image },
      quote: { ...defaultSignInContent.quote, ...signInContent.quote },
  };
  const finalSignUpContent = {
      image: { ...defaultSignUpContent.image, ...signUpContent.image },
      quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
  };

  const currentContent = isSignIn ? finalSignInContent : finalSignUpContent;

  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2 bg-[#FBFADA]">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
      <div className="flex flex-col h-screen items-center justify-center p-6 md:p-12 relative">
        <AuthFormContainer 
          isSignIn={isSignIn} 
          onToggle={toggleForm} 
          onSignIn={onSignIn}
          loading={loading}
          error={error}
        />
      </div>

      <div
        className="hidden md:block relative bg-cover bg-center transition-all duration-500 ease-in-out"
        style={{ backgroundImage: `url(${currentContent.image.src})` }}
        key={currentContent.image.src}
      >

        <div className="absolute inset-x-0 bottom-0 h-[100px] bg-gradient-to-t from-black/80 to-transparent" />
        
        <div className="relative z-10 flex h-full flex-col items-center justify-end p-2 pb-6">
            <blockquote className="space-y-2 text-center text-white">
              <p className="text-lg font-medium">
                “<Typewriter
                    key={currentContent.quote.text}
                    text={currentContent.quote.text}
                    speed={60}
                  />”
              </p>
              <cite className="block text-sm font-light text-slate-300 not-italic">
                  — {currentContent.quote.author}
              </cite>
            </blockquote>
        </div>
      </div>
    </div>
  );
}
