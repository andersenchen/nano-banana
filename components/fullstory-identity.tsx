'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

declare global {
  interface Window {
    FS?: (command: string, data: unknown) => void;
  }
}

export function FullStoryIdentity() {
  useEffect(() => {
    const identifyUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user && typeof window !== 'undefined' && window.FS) {
        window.FS('setIdentity', {
          uid: user.id,
          properties: {
            displayName: user.user_metadata?.name || user.user_metadata?.given_name || 'Anonymous',
            email: user.email || '',
          }
        });
      }
    };

    identifyUser();
  }, []);

  return null;
}