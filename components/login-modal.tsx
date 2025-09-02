"use client";

import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoogleSignInButton } from "./google-signin-button";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectUrl?: string;
}

export function LoginModal({ isOpen, onClose, redirectUrl }: LoginModalProps) {
  const pathname = usePathname();
  const finalRedirectUrl = redirectUrl || pathname || "/";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md min-h-[300px] flex flex-col justify-center">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center">
            Sign in with Google to create memes
          </DialogTitle>
          <DialogDescription className="text-center">
            Transform images and create epic memes in seconds
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 mt-4">
          <GoogleSignInButton 
            redirectUrl={finalRedirectUrl}
            text="signin_with"
            theme="outline"
            size="large"
            shape="pill"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}