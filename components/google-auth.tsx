'use client';

import Script from 'next/script';
import { createClient } from '@/lib/supabase/client';
import type { accounts, CredentialResponse } from 'google-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

declare const google: { accounts: accounts };

// generate nonce to use for google id token sign-in
const generateNonce = async (): Promise<string[]> => {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const encoder = new TextEncoder();
  const encodedNonce = encoder.encode(nonce);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return [nonce, hashedNonce];
};

const GoogleAuth = ({ showButton = false, enableOneTap = true }: { showButton?: boolean; enableOneTap?: boolean }) => {
  const supabase = createClient();
  const router = useRouter();
  const isInitialized = useRef(false);
  const buttonRendered = useRef(false);

  const renderGoogleButton = () => {
    if (!showButton || buttonRendered.current) return;
    
    console.log('Attempting to render Google sign-in button...');
    const buttonElement = document.getElementById('google-signin-button');
    if (buttonElement && !buttonRendered.current) {
      // Clear any existing content
      buttonElement.innerHTML = '';
      console.log('Button element found, rendering Google button...');
      google.accounts.id.renderButton(buttonElement, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        size: 'large',
        logo_alignment: 'left',
        text: 'signin_with',
      });
      buttonRendered.current = true;
      console.log('Google button rendered successfully');
    } else if (!buttonElement) {
      console.error('Google sign-in button element not found in DOM');
    }
  };

  const initializeGoogle = async () => {
    try {
      // Prevent multiple initializations
      if (isInitialized.current) {
        console.log('Google already initialized, skipping...');
        return;
      }

      const [nonce, hashedNonce] = await generateNonce();

      // check if there's already an existing session before initializing
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session', error);
        return;
      }
      if (data.session) {
        // user is already logged in; do not show One Tap but still show button if requested
        if (showButton) {
          console.log('User logged in, rendering Google sign-in button only...');
          // Try multiple times with increasing delays
          setTimeout(renderGoogleButton, 100);
          setTimeout(renderGoogleButton, 300);
          setTimeout(renderGoogleButton, 500);
        }
        return;
      }

      const handleGoogleSignIn = async (response: CredentialResponse) => {
        try {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
            nonce,
          });

          if (error) throw error;
          // redirect to notes after successful login
          router.push('/notes');
        } catch (error) {
          console.error('Error logging in with Google', error);
        }
      };

      if (!google?.accounts?.id) {
        console.error('Google Identity Services not available');
        return;
      }

      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
        callback: handleGoogleSignIn,
        nonce: hashedNonce,
        // with chrome's removal of third-party cookies, we need to use FedCM instead
        use_fedcm_for_prompt: true,
        // enable One Tap auto-select when requested (can also show button simultaneously)
        auto_select: enableOneTap,
        cancel_on_tap_outside: false,
      });

      // Mark as initialized
      isInitialized.current = true;

      if (showButton) {
        // Try multiple times with increasing delays
        setTimeout(renderGoogleButton, 100);
        setTimeout(renderGoogleButton, 300);
        setTimeout(renderGoogleButton, 500);
      }

      if (enableOneTap) {
        // Show One Tap UI (can run alongside the button)
        console.log('Showing Google One Tap prompt...');
        google.accounts.id.prompt();
      }
    } catch (error) {
      console.error('Error initializing Google One Tap', error);
    }
  };

  // Reset state when component mounts or showButton changes
  useEffect(() => {
    isInitialized.current = false;
    buttonRendered.current = false;
    
    // Cleanup function to reset Google state
    return () => {
      if (google?.accounts?.id) {
        try {
          google.accounts.id.cancel();
        } catch (error) {
          console.log('Error canceling Google One Tap:', error);
        }
      }
      isInitialized.current = false;
      buttonRendered.current = false;
    };
  }, [showButton, enableOneTap]);

  return (
    <>
      <Script 
        onReady={() => { 
          console.log('Google GSI script loaded, initializing...'); 
          void initializeGoogle(); 
        }} 
        onError={(e) => console.error('Failed to load Google GSI script:', e)}
        src="https://accounts.google.com/gsi/client" 
      />
      {showButton && (
        <div 
          id="google-signin-button" 
          style={{ minHeight: '40px', display: 'flex', justifyContent: 'center' }}
        />
      )}
    </>
  );
};

export default GoogleAuth;
