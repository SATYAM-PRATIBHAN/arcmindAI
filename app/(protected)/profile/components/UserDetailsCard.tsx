"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useGetUser, User as FullUser } from "@/hooks/useGetUser";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

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
  const [fullUser, setFullUser] = useState<FullUser | null>(null);
  const { getUser } = useGetUser();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUser();
      if (userData?.success) {
        setFullUser(userData?.output);
      }
    };
    fetchUser();
  }, [session]);

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
          <div className="shrink-0 relative">
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
            {fullUser?.plan === "pro" && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded">
                PRO
              </span>
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

        {fullUser && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Subscription Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 space-x-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Plan
                </span>
                <Badge
                  variant={
                    fullUser.plan === "free"
                      ? "secondary"
                      : fullUser.plan === "pro"
                        ? "default"
                        : "outline"
                  }
                >
                  {fullUser.plan.toUpperCase()}
                </Badge>
              </div>
              {fullUser.subscriptionId && (
                <div className="block md:flex md:justify-end space-x-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Subscription ID
                  </span>
                  <div className="bg-muted px-2 py-1 rounded text-xs block">
                    {fullUser.subscriptionId}
                  </div>
                </div>
              )}
              {fullUser.currentPeriodEnd && (
                <div className="space-y-2 space-x-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Current Period Ends
                  </span>
                  <span className="text-sm">
                    {new Date(fullUser.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
              {fullUser.plan === "pro" && fullUser.subscriptionId && (
                <div className="block md:flex md:justify-end">
                  <Button
                    variant="destructive"
                    className="w-fit px-2 cursor-pointer"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    Cancel Subscription
                  </Button>

                  <div className="flex justify-center items-center">
                    <CancelSubscriptionDialog
                      open={cancelDialogOpen}
                      onOpenChange={setCancelDialogOpen}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-pointer text-muted-foreground hover:text-foreground">
                            <InfoIcon className="w-5 h-5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-sm">
                          <p>
                            Your subscription will remain active until the end
                            of the current billing period and will be cancelled
                            for upcoming months.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
