import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
          <Link href="/dashboard" className="font-semibold">
            SchoolApp Plus
          </Link>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-6 md:grid-cols-[220px_1fr]">
        <aside className="border bg-background p-4">
          <nav className="grid gap-1 text-sm">
            <Link
              href="/dashboard"
              className="px-3 py-2 font-medium hover:bg-muted"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/settings"
              className="px-3 py-2 font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Settings
            </Link>
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
