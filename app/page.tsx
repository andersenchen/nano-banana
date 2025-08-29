import { AuthButtonClient } from "@/components/auth-button-client";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ImageGrid } from "@/components/image-grid";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-inter",
});

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-8 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"} className="flex items-center gap-3">
                <span className="text-4xl">🍌</span>
                <span className={`font-bold text-2xl ${inter.className}`}>NANO BANANA</span>
              </Link>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButtonClient />}
          </div>
        </nav>
        <ImageGrid />

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
