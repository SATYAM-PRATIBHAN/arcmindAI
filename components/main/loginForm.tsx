"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const LoginInFormContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorFromQuery = searchParams.get("error");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        // Optional: honor callbackUrl if present
        callbackUrl: (searchParams.get("callbackUrl") as string) || "/",
      });

      if (!result) {
        setError("Unexpected error. Please try again.");
        return;
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      // Successful login
      if (result.url) {
        router.push(result.url);
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-muted h-screen">
      <div className="flex h-full items-center justify-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-6 lg:justify-start">
          <form
            onSubmit={onSubmit}
            className="min-w-sm border-muted bg-background flex w-full max-w-sm flex-col items-center gap-y-4 rounded-md border px-6 py-8 shadow-md"
          >
            <h1 className="text-xl font-semibold">Login</h1>

            {(error || errorFromQuery) && (
              <p className="text-sm text-red-600 w-full text-left">
                {error || errorFromQuery}
              </p>
            )}

            <Input
              type="email"
              placeholder="Email"
              className="text-sm"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              className="text-sm"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              className="cursor-pointer w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </form>
          <div className="text-muted-foreground flex justify-center gap-1 text-sm">
            <p>Need an account?</p>
            <a
              href="/auth/signup"
              className="text-primary cursor-pointer font-medium hover:underline"
            >
              Sign up
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

const LoginInForm = () => {
  return (
    <Suspense
      fallback={
        <section className="bg-muted h-screen">
          <div className="flex h-full items-center justify-center">
            <div className="text-lg">Loading...</div>
          </div>
        </section>
      }
    >
      <LoginInFormContent />
    </Suspense>
  );
};

export default LoginInForm;
