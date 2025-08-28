'use client';

import Script from 'next/script';
import { createClient } from '@/lib/supabase/client';
import type { GoogleIdentityServices, CredentialResponse, GoogleSignInButtonOptions } from 'google-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

declare const google: GoogleIdentityServices;

const BUTTON_RENDER_DELAY = 100;
const BUTTON_MIN_HEIGHT = '44px';

const GOOGLE_BUTTON_CONFIG: GoogleSignInButtonOptions = {
  type: 'standard',
  shape: 'rectangular',
  theme: 'outline',
  size: 'medium',
  logo_alignment: 'left',
  text: 'signin_with',
};

const generateNonce = async (): Promise<[string, string]> => {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const encoder = new TextEncoder();
  const encodedNonce = encoder.encode(nonce);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return [nonce, hashedNonce];
};

const clearRenderTimeout = (timeoutRef: { current: NodeJS.Timeout | null }) => {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
};

const GoogleAuth = ({ showButton = false, enableOneTap = true }: { showButton?: boolean; enableOneTap?: boolean }) => {
  const supabase = createClient();
  const router = useRouter();
  const isInitialized = useRef(false);
  const buttonRendered = useRef(false);
  const renderTimeout = useRef<NodeJS.Timeout | null>(null);

  const renderGoogleButton = () => {
    if (!showButton || buttonRendered.current) return;
    
    clearRenderTimeout(renderTimeout);
    
    const buttonElement = document.getElementById('google-signin-button');
    if (buttonElement && !buttonRendered.current) {
      buttonElement.innerHTML = '';
      google.accounts.id.renderButton(buttonElement, GOOGLE_BUTTON_CONFIG);
      buttonRendered.current = true;
    }
  };

  const initializeGoogle = async () => {
    try {
      if (isInitialized.current) return;

      const [nonce, hashedNonce] = await generateNonce();

      const { data, error } = await supabase.auth.getSession();
      if (error) return;
      
      if (data.session) {
        if (showButton) {
          renderTimeout.current = setTimeout(renderGoogleButton, BUTTON_RENDER_DELAY);
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
          router.push('/notes');
        } catch {
          // In production, you might want to send this to an error reporting service
        }
      };

      if (!google?.accounts?.id) return;

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured');
      }

      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleSignIn,
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        auto_select: enableOneTap,
        cancel_on_tap_outside: false,
      });

      isInitialized.current = true;

      if (showButton) {
        renderTimeout.current = setTimeout(renderGoogleButton, BUTTON_RENDER_DELAY);
      }

      if (enableOneTap) {
        google.accounts.id.prompt();
      }
    } catch {
      // In production, you might want to send this to an error reporting service
    }
  };

  useEffect(() => {
    isInitialized.current = false;
    buttonRendered.current = false;
    
    return () => {
      clearRenderTimeout(renderTimeout);
      
      if (google?.accounts?.id) {
        try {
          google.accounts.id.cancel();
        } catch {
          // Ignore cancellation errors
        }
      }
      isInitialized.current = false;
      buttonRendered.current = false;
    };
  }, [showButton, enableOneTap]);

  return (
    <>
      <Script 
        onReady={() => void initializeGoogle()} 
        onError={() => {/* Handle script load error if needed */}}
        src="https://accounts.google.com/gsi/client" 
      />
      {showButton && (
        <div 
          id="google-signin-button" 
          style={{ 
            minHeight: BUTTON_MIN_HEIGHT, 
            height: BUTTON_MIN_HEIGHT,
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center'
          }}
        />
      )}
    </>
  );
};

export default GoogleAuth;
