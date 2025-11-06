"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useState, Suspense, useEffect } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { DOC_ROUTES } from "@/lib/routes";
import { useSession } from "next-auth/react";

export function OTPFormContent({
  ...props
}: React.ComponentProps<typeof Card>) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const session = useSession();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      setError("Email not found. Please try signing up again.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(DOC_ROUTES.API.AUTH.VERIFY_OTP, {
        email,
        otp,
      });
      if (res.data.success) {
        const userId =
          session?.data && session.status === "authenticated"
            ? (session.data as { user?: { id?: string } })?.user?.id
            : null;
        router.push(userId ? DOC_ROUTES.PROFILE : DOC_ROUTES.AUTH.LOGIN);
      } else {
        setError(res.data.message);
      }
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Verification failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Email not found. Please try signing up again.");
      return;
    }

    setError(null);
    setResendMessage(null);
    setResendLoading(true);
    try {
      const res = await axios.post(DOC_ROUTES.API.AUTH.RESEND_OTP, { email });
      if (res.data.success) {
        setResendMessage("New OTP sent to your email");
        setResendTimer(60); // Start 60 second timer
      } else {
        setError(res.data.message);
      }
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Failed to resend OTP";
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Enter verification code</CardTitle>
        <CardDescription>We sent a 6-digit code to your email.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify}>
          <FieldGroup>
            {error && (
              <p className="text-sm text-red-600 w-full text-left">{error}</p>
            )}
            {resendMessage && (
              <p className="text-sm text-green-600 w-full text-left">
                {resendMessage}
              </p>
            )}
            <Field>
              <FieldLabel htmlFor="otp">Verification code</FieldLabel>
              <InputOTP
                maxLength={6}
                id="otp"
                required
                value={otp}
                onChange={(value) => setOtp(value)}
              >
                <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <FieldDescription>
                Enter the 6-digit code sent to your email.
              </FieldDescription>
            </Field>
            <FieldGroup>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>
              <FieldDescription className="text-center">
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading || resendTimer > 0}
                  className="cursor-pointer text-primary hover:underline disabled:opacity-50"
                >
                  {resendLoading
                    ? "Resending..."
                    : resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : "Resend"}
                </button>
              </FieldDescription>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

export function OTPForm({ ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Suspense
      fallback={
        <Card {...props}>
          <CardHeader>
            <CardTitle>Enter verification code</CardTitle>
            <CardDescription>
              We sent a 6-digit code to your email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      }
    >
      <OTPFormContent {...props} />
    </Suspense>
  );
}
