'use client';

import { useEffect } from 'react';
import { init } from '@fullstory/browser';

export function FullStoryInit() {
  useEffect(() => {
    init({
      orgId: process.env.NEXT_PUBLIC_FULLSTORY_ORG!,
      debug: false
    });
  }, []);

  return null;
}