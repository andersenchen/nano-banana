'use client';

import Script from 'next/script';
import { createClient } from '@/lib/supabase/client';
import type { accounts, CredentialResponse } from 'google-one-tap';
import { useRouter } from 'next/navigation';

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

const GoogleOneTap = ({ showButton = false }: { showButton?: boolean }) => {
  const supabase = createClient();
  const router = useRouter();

  const initializeGoogle = async () => {
    const [nonce, hashedNonce] = await generateNonce();

    // check if there's already an existing session before initializing
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session', error);
    }
    if (data.session) {
      // user is already logged in; do not show One Tap or button
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

    google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
      callback: handleGoogleSignIn,
      nonce: hashedNonce,
      // with chrome's removal of third-party cookies, we need to use FedCM instead
      use_fedcm_for_prompt: true,
      auto_select: !showButton, // only auto-select for one-tap, not button
      cancel_on_tap_outside: false,
    });

    if (showButton) {
      // Render the Sign-In button
      google.accounts.id.renderButton(
        document.getElementById('google-signin-button')!,
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: '250',
        }
      );
    } else {
      // Show One Tap UI
      google.accounts.id.prompt();
    }
  };

  return (
    <>
      <Script onReady={() => { void initializeGoogle(); }} src="https://accounts.google.com/gsi/client" />
      {showButton && <div id="google-signin-button"></div>}
    </>
  );
};

export default GoogleOneTap;