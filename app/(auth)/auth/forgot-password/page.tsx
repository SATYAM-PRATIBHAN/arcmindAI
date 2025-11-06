"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Image from "next/image";
import { DOC_ROUTES } from "@/lib/routes";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { useForgotPassword } from "@/hooks/useForgotPassword";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    forgotPassword,
    isLoading,
    error: forgetPasswordError,
  } = useForgotPassword();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = await forgotPassword(email);

    if (result && result.message) {
      setSent(true);
      setSuccessMessage("Reset link sent successfully! Check your email.");
    } else {
      // Error is handled by the hook
    }
  }

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
            Forgot your password?
          </h2>
          <p className="text-gray-600 text-sm mb-8">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>

          {forgetPasswordError && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>{forgetPasswordError}</AlertDescription>
            </Alert>
          )}

          {sent ? (
            <div className="text-center">
              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                  {successMessage}
                </div>
              )}
              <Link
                href={DOC_ROUTES.AUTH.LOGIN}
                className="text-sm text-gray-600 hover:text-black transition underline"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <Label className="block text-xs text-gray-700 mb-2">
                  Email
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-5 py-6 rounded-full border border-gray-200 bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition"
                  required
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer w-full bg-black text-white font-medium py-3 rounded-full hover:bg-gray-800 transition mt-4"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}

          {/* Footer Links */}
          <div className="mt-12 flex items-center justify-between text-xs text-gray-600">
            <Link
              href={DOC_ROUTES.AUTH.LOGIN}
              className="hover:text-black transition"
            >
              Remember your password? <span className="underline">Sign in</span>
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
          alt="Forgot Password"
          className="w-full h-full object-cover rounded-4xl"
          width={700}
          height={700}
          priority
        />
      </div>
    </section>
  );
}
