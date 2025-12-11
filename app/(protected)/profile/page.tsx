"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useGetUser } from "@/hooks/useGetUser";
import { useHistory } from "@/lib/contexts/HistoryContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserDetailsCard } from "./components/UserDetailsCard";
import { GenerationHistoryCard } from "./components/GenerationHistoryCard";
import { Background } from "@/components/background";
import { useUpdatePassword } from "@/hooks/useUpdatePassword";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";

interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  avatar: string;
  isVerified: boolean;
  plan: string;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { getUser, error } = useGetUser();
  const { history, isLoading: historyLoading } = useHistory();
  const [user, setUser] = useState<User | null>(null);
  const hasFetchedUser = useRef(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    updatePassword,
    isLoading: isLoadingPassword,
    error: updatePasswordError,
  } = useUpdatePassword();
  const {
    updateProfile,
    isLoading: isUpdatingProfile,
    error: updateProfileError,
  } = useUpdateProfile();

  const handleUpdateProfile = async (formData: {
    username: string;
    avatar: File | null;
  }) => {
    if (!user) return;

    const result = await updateProfile(formData);

    if (result.success) {
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 5000);
      // Refetch user data
      hasFetchedUser.current = false;
      const userData = await getUser();
      if (userData?.success) {
        setUser(userData.output);
      }
    } else {
      setValidationError(result.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async (passwords: {
    previousPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setValidationError("New password and confirm password do not match");
      return;
    }

    setValidationError(null);
    const res = await updatePassword(
      passwords.previousPassword,
      passwords.newPassword
    );

    if (res?.success) {
      setSuccessMessage("Password updated successfully!");
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      // @ts-expect-error id is added to session in NextAuth callbacks
      if (session?.user?.id && !hasFetchedUser.current) {
        hasFetchedUser.current = true;
        const userData = await getUser();
        if (userData?.success) {
          setUser(userData.output);
        }
      }
    };

    if (status === "authenticated") {
      fetchUser();
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertDescription>
            You need to be logged in to view your profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <Background variant="top" className="from-muted/80 via-muted to-muted/80">
      <div className="container mx-auto py-28 lg:py-42 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold mb-6">Profile</h1>

          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {validationError && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {updatePasswordError && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>{updatePasswordError}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-6 bg-green-100 border-green-400 text-green-800">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {updateProfileError && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>{updatePasswordError}</AlertDescription>
            </Alert>
          )}

          <UserDetailsCard
            user={user}
            historyLength={history.length}
            onUpdateProfile={handleUpdateProfile}
            onChangePassword={handleChangePassword}
            isUpdatingProfile={isUpdatingProfile}
            isLoadingPassword={isLoadingPassword}
          />

          <GenerationHistoryCard history={history} isLoading={historyLoading} />
        </div>
      </div>
    </Background>
  );
}
