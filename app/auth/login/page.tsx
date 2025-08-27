import { LoginForm } from "@/components/login-form";
import GoogleOneTap from "@/components/google-one-tap";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <GoogleOneTap />
        <LoginForm />
      </div>
    </div>
  );
}
