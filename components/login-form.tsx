"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleSignInButton } from "./google-signin-button";

export function LoginForm({
  className,
  redirectUrl = "/",
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  redirectUrl?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Sign in with your Google account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleSignInButton
            redirectUrl={redirectUrl}
            text="signin_with"
            theme="outline"
            size="large"
            shape="rectangular"
          />
        </CardContent>
      </Card>
    </div>
  );
}
