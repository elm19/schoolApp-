import Link from "next/link";
import { redirect } from "next/navigation";

import { TeacherSignUpForm } from "@/components/teacher-sign-up-form";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherSignUpPage() {
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
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          SchoolApp Plus
        </Link>
        <TeacherSignUpForm />
        <p className="text-center text-sm text-muted-foreground">
          Signing up as a student?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Use student signup
          </Link>
        </p>
      </div>
    </main>
  );
}
