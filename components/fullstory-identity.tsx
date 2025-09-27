'use client';

import { useEffect } from 'react';
import { FullStory } from '@fullstory/browser';
import { createClient } from '@/lib/supabase/client';

export function FullStoryIdentity() {
  useEffect(() => {
    const identifyUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        FullStory('setIdentity', {
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