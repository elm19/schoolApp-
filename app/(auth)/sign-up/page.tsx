import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { createClient } from "@/lib/supabase/server";

export default async function SignUpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <div className="flex w-full flex-col items-center gap-6">
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          SchoolApp Plus
        </Link>
        <AuthForm mode="sign-up" />
      </div>
    </main>
  );
}
