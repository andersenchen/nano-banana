"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AuthButtonClient } from "@/components/auth-button-client";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ImageUploadButton } from "@/components/image-upload-button";
import { MememakerLogoMinimal } from "@/components/mememaker-logo";
import { hasEnvVars } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-inter",
});

interface HeaderProps {
  activePage?: "explore" | "my-creations";
}

export function Header({ activePage = "explore" }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10">
      <div className="w-full max-w-5xl flex justify-between items-center px-5 py-4">
        <div className="flex gap-8 items-center">
          <Link href={"/"} className="flex items-center gap-2.5">
            <MememakerLogoMinimal className="w-10 h-8" />
            <span className={`font-bold text-xl tracking-tight ${inter.className}`}>mememaker</span>
          </Link>
          {user && (
            <div className="flex gap-6 items-center ml-2">
              <Link
                href="/"
                className={`text-sm font-semibold transition-colors pb-0.5 ${
                  activePage === "explore"
                    ? "text-foreground border-b-2 border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Explore
              </Link>
              <Link
                href="/my-creations"
                className={`text-sm font-semibold transition-colors pb-0.5 ${
                  activePage === "my-creations"
                    ? "text-foreground border-b-2 border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Creations
              </Link>
              <div className="ml-2">
                <ImageUploadButton />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 items-center">
          {!hasEnvVars ? <EnvVarWarning /> : <AuthButtonClient />}
        </div>
      </div>
    </nav>
  );
}
