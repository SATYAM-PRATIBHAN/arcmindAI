"use client";

import { DOC_ROUTES } from "@/lib/routes";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(false);
  const [checkingGuest, setCheckingGuest] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsGuest(localStorage.getItem("guestMode") === "true");
    }
    setCheckingGuest(false);
  }, []);

  useEffect(() => {
    if (status === "loading" || checkingGuest) return;
    if (!session && !isGuest) {
      router.push(DOC_ROUTES.AUTH.LOGIN);
    }
  }, [session, status, router, isGuest, checkingGuest]);

  if (status === "loading" || checkingGuest) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-lg font-medium text-muted-foreground">
          <span className="w-8 h-8 animate-spin rounded-full border-4 border-t-transparent border-muted" />
          Loading...
        </div>
      </div>
    );
  }

  if (!session && !isGuest) {
    return null;
  }

  return <>{children}</>;
}
