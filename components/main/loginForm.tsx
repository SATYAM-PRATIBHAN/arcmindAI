"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { DOC_ROUTES } from "@/lib/routes";
import Link from "next/link";
import { Label } from "@/components/ui/label";

const LoginInFormContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl:
          (searchParams.get("callbackUrl") as string) || DOC_ROUTES.HOME,
      });

      if (!result) {
        setError("Unexpected error. Please try again.");
        return;
      }
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) router.push(result.url);
      else router.push(DOC_ROUTES.HOME);
    } catch (err) {
      console.error(err);
      setError("Failed to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex h-screen bg-white text-black">
      {/* Left Section (Form) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12">
        {/* Form Container */}
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="mb-12 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-black">ArcMind AI</h1>
            <Link
              href={DOC_ROUTES.HOME}
              className="text-sm text-gray-600 hover:text-black transition underline"
            >
              ← Back to Home
            </Link>
          </div>
          <h2 className="text-4xl font-light text-black mb-3">
            Sign in to your account
          </h2>
          <p className="text-gray-600 text-sm mb-8">
            Welcome back! Please sign in to your account.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <Label className="block text-xs text-gray-700 mb-2">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-5 py-6 rounded-full border border-gray-200 bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <Label className="block text-xs text-gray-700 mb-2">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••••••••"
                  className="w-full px-5 py-6 rounded-full border border-gray-200 bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link
                href={DOC_ROUTES.AUTH.FORGOT_PASSWORD}
                className="text-xs text-gray-600 hover:text-black transition underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full bg-black text-white font-medium py-3 rounded-full hover:bg-gray-800 transition mt-4"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-12 flex items-center justify-between text-xs text-gray-600">
            <Link
              href={DOC_ROUTES.AUTH.SIGN_UP}
              className="hover:text-black transition"
            >
              Don&apos;t have an account?{" "}
              <span className="underline">Sign up</span>
            </Link>
            <Link
              href={DOC_ROUTES.PRIVACY_POLICY}
              className="hover:text-black transition underline"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      {/* Right Section (Image Placeholder) */}
      <div className="hidden md:flex w-1/2 items-center justify-center m-4 rounded-4xl bg-gray-200">
        <Image
          src="/loginImage.webp"
          alt="Login"
          className="w-full h-full object-cover rounded-4xl"
          width={700}
          height={700}
          priority
        />
      </div>
    </section>
  );
};

const LoginInForm = () => {
  return (
    <Suspense
      fallback={
        <section className="flex h-screen items-center justify-center bg-white text-black">
          <div className="text-lg">Loading...</div>
        </section>
      }
    >
      <LoginInFormContent />
    </Suspense>
  );
};

export default LoginInForm;
