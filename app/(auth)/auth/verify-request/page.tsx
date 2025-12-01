"use client";

import { OTPForm } from "@/components/main/otpForm";
import Image from "next/image";
import Link from "next/link";
import { DOC_ROUTES } from "@/lib/routes";
import { useSearchParams } from "next/navigation";

export default function VerifyRequestPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  return (
    <section className="flex h-screen bg-white text-black">
      {/* Left Section (Form) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="mb-10 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-black">ArcMind AI</h1>
            <Link
              href={DOC_ROUTES.AUTH.LOGIN}
              className="text-sm text-gray-600 hover:text-black transition underline"
            >
              ← Back to Sign in
            </Link>
          </div>

          <h2 className="text-4xl font-light text-black mb-2">
            Verify your email
          </h2>
          <p className="text-gray-600 text-sm">
            We sent the 6-digit code to: <span className="font-medium">{email}</span>
          </p>
          <p className="text-gray-600 text-sm mb-8">
            Please ensure the email you want to register is correct.
          </p>

          <OTPForm />

          {/* Footer */}
          <div className="mt-10 flex items-center justify-between text-xs text-gray-600">
            <Link
              href={DOC_ROUTES.HOME}
              className="hover:text-black transition underline"
            >
              Back to Home
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

      {/* Right Section (Image) */}
      <div className="hidden md:flex w-1/2 items-center justify-center m-4 rounded-4xl bg-gray-200">
        <Image
          src="/loginImage.webp"
          alt="Verification"
          className="w-full h-full object-cover rounded-4xl"
          width={700}
          height={700}
          priority
        />
      </div>
    </section>
  );
}
