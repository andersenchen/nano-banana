import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  // Use getUser() to access user_metadata which contains name information
  const { data: { user } } = await supabase.auth.getUser();

  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.user_metadata?.name || user.user_metadata?.given_name || user.email}!
      <LogoutButton />
    </div>
  ) : (
    <Button asChild size="lg" variant={"default"}>
      <Link href="/auth/login">Login to make memes</Link>
    </Button>
  );
}
