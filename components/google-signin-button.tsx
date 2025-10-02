"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface GoogleSignInButtonProps {
  redirectUrl?: string;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  shape?: "rectangular" | "pill" | "circle" | "square";
}

export function GoogleSignInButton({
  redirectUrl = "/",
  text = "signin_with",
  theme = "outline",
  size = "large",
  shape = "pill"
}: GoogleSignInButtonProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectUrl}`,
        },
      });

      if (error) {
        console.error('Google sign-in error:', error);
        setIsLoading(false);
      }
      // If successful, the page will redirect, so we don't need to handle success here
    } catch (error) {
      console.error('Google sign-in error:', error);
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    switch (text) {
      case 'signup_with': return 'Sign up with Google';
      case 'continue_with': return 'Continue with Google';
      case 'signin': return 'Sign in';
      default: return 'Sign in with Google';
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small': return { height: '32px', fontSize: '13px', padding: '8px 12px' };
      case 'medium': return { height: '40px', fontSize: '14px', padding: '10px 16px' };
      case 'large': return { height: '48px', fontSize: '16px', padding: '12px 20px' };
      default: return { height: '40px', fontSize: '14px', padding: '10px 16px' };
    }
  };

  const getButtonTheme = () => {
    switch (theme) {
      case 'filled_blue': return { backgroundColor: '#4285f4', color: 'white', border: 'none' };
      case 'filled_black': return { backgroundColor: '#000', color: 'white', border: 'none' };
      default: return { backgroundColor: 'white', color: '#3c4043', border: '1px solid #dadce0' };
    }
  };

  const buttonSize = getButtonSize();
  const buttonTheme = getButtonTheme();

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      style={{
        ...buttonSize,
        ...buttonTheme,
        borderRadius: shape === 'pill' ? '24px' : shape === 'circle' ? '50%' : '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontFamily: 'Roboto, arial, sans-serif',
        fontWeight: 500,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.7 : 1,
        transition: 'background-color 0.218s, border-color 0.218s, box-shadow 0.218s',
        boxShadow: theme === 'outline' ? '0 1px 2px 0 rgba(60, 64, 67, 0.30), 0 1px 3px 1px rgba(60, 64, 67, 0.15)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isLoading && theme === 'outline') {
          e.currentTarget.style.backgroundColor = '#f8f9fa';
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading && theme === 'outline') {
          e.currentTarget.style.backgroundColor = 'white';
        }
      }}
    >
      {/* Google Logo */}
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {isLoading ? 'Signing in...' : getButtonText()}
    </button>
  );
}