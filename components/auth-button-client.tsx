"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "./logout-button";
import { LoginModal } from "./login-modal";

export function AuthButtonClient() {
  const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [userLoaded, setUserLoaded] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setUserLoaded(true);
    };

    checkUser();

    // Listen for auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      // Close modal when user logs in
      if (session?.user) {
        setShowLoginModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!userLoaded) {
    return (
      <Button size="lg" variant="default" disabled>
        Loading...
      </Button>
    );
  }

  return (
    <>
      {user ? (
        <div className="flex items-center gap-4">
          Hey, {user.user_metadata?.name || user.user_metadata?.given_name || user.email}!
          <LogoutButton />
        </div>
      ) : (
        <Button 
          size="lg" 
          variant="default"
          onClick={() => setShowLoginModal(true)}
        >
          Login to make memes
        </Button>
      )}
      
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}