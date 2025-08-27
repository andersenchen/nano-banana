'use client'

import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import type { accounts, CredentialResponse } from 'google-one-tap'
import { useRouter } from 'next/navigation'

declare const google: { accounts: accounts }

// generate nonce to use for google id token sign-in
const generateNonce = async (): Promise<string[]> => {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const encoder = new TextEncoder()
  const encodedNonce = encoder.encode(nonce)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return [nonce, hashedNonce]
}

const GoogleOneTap = () => {
  const supabase = createClient()
  const router = useRouter()

  const initializeGoogleOneTap = async () => {
    const [nonce, hashedNonce] = await generateNonce()

    // check if there's already an existing session before initializing the one-tap UI
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting session', error)
    }
    if (data.session) {
      router.push('/')
      return
    }

    /* global google */
    google.accounts.id.initialize({
      // @ts-expect-error: NEXT_PUBLIC_GOOGLE_CLIENT_ID is injected at build time
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: async (response: CredentialResponse) => {
        try {
          const { data: _sessionData, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
            nonce,
          })

          if (error) throw error
          // redirect to protected page
          router.push('/')
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error logging in with Google One Tap', error)
        }
      },
      nonce: hashedNonce,
      // with chrome's removal of third-party cookies, we need to use FedCM instead
      use_fedcm_for_prompt: true,
    })
    google.accounts.id.prompt() // Display the One Tap UI
  }

  return <Script onReady={initializeGoogleOneTap} src="https://accounts.google.com/gsi/client" />
}

export default GoogleOneTap


