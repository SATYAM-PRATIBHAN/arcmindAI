"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Mail,
  User,
  ShieldCheck,
  ShieldAlert,
  MailCheck,
} from "lucide-react";
import Image from "next/image";
import { UpdateProfileDialog } from "./UpdateProfileDialog";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DOC_ROUTES } from "@/lib/routes";

interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  avatar: string;
  isVerified: boolean;
}

interface UserDetailsCardProps {
  user: User | null;
  historyLength: number;
  onUpdateProfile: (formData: {
    username: string;
    avatar: File | null;
  }) => Promise<void>;
  onChangePassword: (passwords: {
    previousPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
  isUpdatingProfile: boolean;
  isLoadingPassword?: boolean;
}

export function UserDetailsCard({
  user,
  historyLength,
  onUpdateProfile,
  onChangePassword,
  isUpdatingProfile,
  isLoadingPassword,
}: UserDetailsCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          User Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="shrink-0">
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt={session?.user?.name || "User Avatar"}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                {session?.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{user?.username || "User"}</h2>
              {user && (
                <Badge
                  variant="outline"
                  className={`text-sm flex items-center gap-1 ${user.isVerified ? "bg-green-100 text-green-800 border-green-500" : "bg-red-100 text-red-800 border-red-500"}`}
                >
                  {user.isVerified ? (
                    <>
                      <ShieldCheck className="h-5 w-5 text-green-500" />
                      Verified
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-5 w-5 text-red-500" />
                      Unverified
                    </>
                  )}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              {session?.user?.email}
            </div>
            {user && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>User ID:</span>
              <code className="bg-muted px-1 py-0.5 rounded text-xs">
                {user?.id || "Loading..."}
              </code>
            </div>
            <div className="flex items-center gap-1">
              <span>Total Generations:</span>
              <span className="font-medium">{historyLength}</span>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <UpdateProfileDialog
                onUpdateProfile={onUpdateProfile}
                isUpdatingProfile={isUpdatingProfile}
              />
              <ChangePasswordDialog
                onChangePassword={onChangePassword}
                isLoading={isLoadingPassword}
              />
              {!user?.isVerified && (
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `${DOC_ROUTES.AUTH.VERIFY_REQUEST}?email=${encodeURIComponent(user?.email || "")}`,
                    )
                  }
                  className="cursor-pointer flex items-center gap-2 mt-2"
                >
                  <MailCheck className="w-4 h-4" />
                  Verify email
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
