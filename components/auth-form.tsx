"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

type AuthMode = "sign-in" | "sign-up";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [stepMessage, setStepMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isSignIn = mode === "sign-in";

  async function handleSubmit(formData: FormData) {
    setError(null);
    setStepMessage(null);
    setIsPending(true);

    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const supabase = createClient();

    setStepMessage(isSignIn ? "Signing in..." : "Creating your account...");

    const result = isSignIn
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

    if (result.error) {
      setError(getFriendlyAuthError(result.error.message, isSignIn));
      setIsPending(false);
      return;
    }

    let redirectTo = searchParams.get("redirectedFrom") ?? "/dashboard";

    if (isSignIn) {
      setStepMessage("Checking your profile...");
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (!profile) {
        setStepMessage("Connecting to SchoolApp if needed...");
        const connection = await connectSchoolApp(email, password);
        if (!connection.success) {
          redirectTo = `/dashboard?uncompleted=true&platformError=${encodeURIComponent(
            connection.message,
          )}`;
        } else {
          redirectTo = "/dashboard?uncompleted=true";
        }
      }
    } else {
      setStepMessage("Connecting to SchoolApp...");
      const connection = await connectSchoolApp(email, password);
      if (!connection.success) {
        redirectTo = `/dashboard?uncompleted=true&platformError=${encodeURIComponent(
          connection.message,
        )}`;
      } else {
        redirectTo = "/dashboard?uncompleted=true";
      }
    }

    setStepMessage(isSignIn ? "Redirecting..." : "Redirecting to dashboard...");
    setIsPending(false);
    router.push(redirectTo);
    router.refresh();
  }

  async function connectSchoolApp(email: string, password: string) {
    try {
      setStepMessage("Checking your school account...");
      const response = await fetch("/api/schoolapp-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !data.success) {
        return {
          success: false,
          message: getFriendlyPlatformError(data.message),
        };
      }

      setStepMessage("Fetching your student profile...");
      setStepMessage("Saving your profile...");
      return { success: true, message: "SchoolApp connected." };
    } catch {
      return {
        success: false,
        message: "Network/server error. Please try again.",
      };
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isSignIn ? "Sign in" : "Create an account"}</CardTitle>
        <CardDescription>
          Use your SchoolApp email and password. We will use these credentials
          to verify your school account and create your student profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignIn ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </div>

          {error ? (
            <div className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          {stepMessage ? (
            <div className="flex items-center gap-2 border bg-muted/40 p-3 text-sm text-muted-foreground">
              {isPending ? <Spinner /> : null}
              <span>{stepMessage}</span>
            </div>
          ) : null}

          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending
              ? (
                  <>
                    <Spinner />
                    Please wait...
                  </>
                )
              : isSignIn
                ? "Sign in"
                : "Sign up"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignIn ? "Need an account?" : "Already have an account?"}{" "}
          <Link
            href={isSignIn ? "/sign-up" : "/sign-in"}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {isSignIn ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function getFriendlyAuthError(message: string, isSignIn: boolean) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("invalid")) {
    return isSignIn
      ? "Invalid Supabase credentials. Check your email and password."
      : "This account could not be created with those credentials.";
  }

  if (lowerMessage.includes("already")) {
    return "An account already exists for this email. Try signing in instead.";
  }

  return "Supabase authentication failed. Please check your details and try again.";
}

function getFriendlyPlatformError(message?: string) {
  if (!message) {
    return "School platform login failed. Please check your SchoolApp credentials.";
  }

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("invalid") || lowerMessage.includes("authentication")) {
    return "School platform login failed. Please check your SchoolApp email and password.";
  }

  if (lowerMessage.includes("profile")) {
    return "Profile could not be created from your SchoolApp account.";
  }

  return message;
}
