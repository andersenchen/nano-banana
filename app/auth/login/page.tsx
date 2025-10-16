import { Suspense } from "react";
import { LoginFormWrapper } from "@/components/login-form-wrapper";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginFormWrapper />
    </Suspense>
  );
}
