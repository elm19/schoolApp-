import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
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

  const role = String(user.user_metadata?.role ?? "student");
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-foreground">
      <div className="mx-auto flex min-h-screen w-full">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r bg-background/95 px-4 py-4 md:flex md:flex-col">
          <Link href="/dashboard" className="flex items-center gap-3 px-2 py-2">
            <Image
              src="/logo.png"
              alt="SchoolApp+ logo"
              width={36}
              height={36}
              className="rounded-md"
            />
            <span className="text-base font-semibold">SchoolApp+</span>
          </Link>

          <nav className="mt-8 grid gap-1 text-sm">
            <SidebarLink href="/dashboard" label="Dashboard" />
            <SidebarLink href="/courses" label="Courses" />
            <SidebarLink href="/settings" label="Settings" />
          </nav>

          <div className="mt-auto rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                {getInitial(user.email)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">{displayRole}</p>
              </div>
            </div>
            <div className="mt-3">
              <SignOutButton />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b bg-background/90 px-5 py-3 backdrop-blur md:hidden">
            <div className="flex items-center justify-between gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                <Image
                  src="/logo.png"
                  alt="SchoolApp+ logo"
                  width={28}
                  height={28}
                  className="rounded"
                />
                SchoolApp+
              </Link>
              <SignOutButton />
            </div>
            <nav className="mt-3 flex gap-2 overflow-x-auto text-sm">
              <SidebarLink href="/dashboard" label="Dashboard" />
              <SidebarLink href="/courses" label="Courses" />
              <SidebarLink href="/settings" label="Settings" />
            </nav>
          </header>

          <main className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {label}
    </Link>
  );
}

function getInitial(email?: string | null) {
  return email?.[0]?.toUpperCase() ?? "S";
}
