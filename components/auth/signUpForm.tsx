"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { signUpSchema } from "@/lib/validation/signUpschema";

type FormErrors = Partial<Record<"email" | "username" | "password", string>>;

const SignUpForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState<FormErrors>({}); // 🧠 error state
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    e.preventDefault();

    setErrors({});

    const result = signUpSchema.safeParse({ email, username, password });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      if (result.error && Array.isArray(result.error.issues)) {
        result.error.issues.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          fieldErrors[field] = err.message;
        });
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      const res = await axios.post("/api/auth/signup", {
        email,
        username,
        password,
      });
      if (res.data.success) {
        setLoading(false);
        router.push(`/auth/verify-request?email=${encodeURIComponent(email)}`);
      }
    } catch (err) {
      setLoading(false);
      console.error("Signup failed:", err);
    }
  };

  return (
    <section className="bg-muted h-screen">
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-6 lg:justify-start">
          <form
            onSubmit={handleSignup}
            className="min-w-sm border-muted bg-background flex w-full max-w-sm flex-col items-center gap-y-4 rounded-md border px-6 py-8 shadow-md"
          >
            <h1 className="text-xl font-semibold">Signup</h1>

            {/* Email */}
            <div className="w-full">
              <Input
                type="email"
                placeholder="Email"
                className="text-sm"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Username */}
            <div className="w-full">
              <Input
                type="text"
                placeholder="Username"
                className="text-sm"
                onChange={(e) => setUsername(e.target.value)}
                value={username}
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div className="w-full">
              <Input
                type="password"
                placeholder="Password"
                className="text-sm"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="cursor-pointer w-full mt-2"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="text-muted-foreground flex justify-center gap-1 text-sm">
            <p>Already a user?</p>
            <a
              href="/auth/login"
              className="cursor-pointer text-primary font-medium hover:underline"
            >
              Login
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignUpForm;
