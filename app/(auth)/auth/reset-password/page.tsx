"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DOC_ROUTES } from "@/lib/routes";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useResetPassword } from "@/hooks/useResetPassword";
import { signUpSchema } from "@/lib/validation/signUpschema";

function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { resetPassword, isLoading, error, isTokenValid, isValidating } =
    useResetPassword(token || undefined);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    // Validate password format
    const passwordValidation = signUpSchema.shape.password.safeParse(password);
    if (!passwordValidation.success) {
      setPasswordError(passwordValidation.error.issues[0].message);
      return;
    }

    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }

    if (!token) return;

    const result = await resetPassword(token, password);

    if (result && result.message) {
      setSuccessMessage("Password reset successful! Redirecting to login…");
      setTimeout(() => {
        router.push(DOC_ROUTES.AUTH.LOGIN);
      }, 2000);
    }
  }

  if (!token || isTokenValid === false)
    return (
      <section className="flex h-screen bg-white text-black">
        {/* Left Section (Image) */}
        <div className="hidden md:flex w-1/2 items-center justify-center m-4 rounded-4xl bg-gray-200">
          <Image
            src="/signupImage.webp"
            alt="Reset Password"
            className="w-full h-full object-cover rounded-4xl"
            width={700}
            height={700}
            priority
          />
        </div>

        {/* Right Section (Form) */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12">
          <div className="max-w-md w-full">
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
              Invalid Link
            </h2>
            <p className="text-red-500 text-sm mb-8">
              This password reset link is invalid, expired, or has already been
              used.
            </p>
            <Link
              href={DOC_ROUTES.AUTH.FORGOT_PASSWORD}
              className="text-sm text-gray-600 hover:text-black transition underline"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      </section>
    );

  if (isValidating || isTokenValid === null) {
    return (
      <section className="flex h-screen bg-white text-black">
        <div className="w-full flex items-center justify-center">
          <p className="text-gray-600">Verifying link...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-screen bg-white text-black">
      {/* Left Section (Image) */}
      <div className="hidden md:flex w-1/2 items-center justify-center m-4 rounded-4xl bg-gray-200">
        <Image
          src="/signupImage.webp"
          alt="Reset Password"
          className="w-full h-full object-cover rounded-4xl"
          width={700}
          height={700}
          priority
        />
      </div>

      {/* Right Section (Form) */}
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
            Reset Your Password
          </h2>
          <p className="text-gray-600 text-sm mb-8">
            Enter your new password below.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {passwordError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {passwordError}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-6">
            {/* Password Field */}
            <div>
              <label className="block text-xs text-gray-700 mb-2">
                New Password
              </label>
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

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••••••••••••••••"
                  className="w-full px-5 py-6 rounded-full border border-gray-200 bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer w-full bg-black text-white font-medium py-3 rounded-full hover:bg-gray-800 transition mt-4"
            >
              {isLoading ? "Saving..." : "Reset Password"}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-12 flex items-center justify-between text-xs text-gray-600">
            <Link
              href={DOC_ROUTES.AUTH.LOGIN}
              className="hover:text-black transition"
            >
              Back to Login
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
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <section className="flex h-screen bg-white text-black">
          <div className="w-full flex items-center justify-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </section>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
