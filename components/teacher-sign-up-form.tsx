"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";

export function TeacherSignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setStatus("Creating teacher account...");
    setIsPending(true);

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          role: "teacher",
          name,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setStatus(null);
      setIsPending(false);
      return;
    }

    setStatus("Redirecting to dashboard...");
    setIsPending(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Teacher sign up</CardTitle>
        <CardDescription>
          Create a teacher account. An admin must confirm your teacher status
          before dashboard tools are enabled.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teacher-name">Name</Label>
            <Input id="teacher-name" name="name" autoComplete="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teacher-email">Email</Label>
            <Input
              id="teacher-email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teacher-password">Password</Label>
            <Input
              id="teacher-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {error ? (
            <div className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          {status ? (
            <div className="flex items-center gap-2 border bg-muted/40 p-3 text-sm text-muted-foreground">
              {isPending ? <Spinner /> : null}
              <span>{status}</span>
            </div>
          ) : null}

          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner />
                Please wait...
              </>
            ) : (
              "Create teacher account"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
