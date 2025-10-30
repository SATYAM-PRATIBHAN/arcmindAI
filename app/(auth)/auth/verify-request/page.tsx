import { OTPForm } from "@/components/auth/otpForm";

export default function VerifyRequestPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <OTPForm />
      </div>
    </div>
  );
}
