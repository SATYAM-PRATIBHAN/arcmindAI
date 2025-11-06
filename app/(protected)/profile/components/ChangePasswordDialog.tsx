"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signUpSchema } from "@/lib/validation/signUpschema";

interface ChangePasswordDialogProps {
  onChangePassword: (passwords: {
    previousPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function ChangePasswordDialog({
  onChangePassword,
  isLoading,
}: ChangePasswordDialogProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    previousPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [showPasswords, setShowPasswords] = useState({
    previousPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const handleChangePassword = async () => {
    // Validation
    if (
      !formData.previousPassword ||
      !formData.newPassword ||
      !formData.confirmPassword
    ) {
      setError("All fields are required");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    if (formData.newPassword === formData.previousPassword) {
      setError("New password must be different from the previous password");
      return;
    }

    // Validate new password against schema
    const passwordValidation = signUpSchema.shape.password.safeParse(
      formData.newPassword,
    );
    if (!passwordValidation.success) {
      setError(passwordValidation.error.issues[0].message);
      return;
    }

    if (formData.previousPassword === formData.newPassword) {
      setError("New password must be different from the previous password");
      return;
    }

    setError("");
    try {
      await onChangePassword({
        previousPassword: formData.previousPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      setIsModalOpen(false);
      setFormData({
        previousPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change password",
      );
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setFormData({
        previousPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setError("");
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer mt-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Lock className="w-4 h-4 mr-2" />
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="previousPassword">Previous Password</Label>
            <div className="relative">
              <Input
                id="previousPassword"
                type={showPasswords.previousPassword ? "text" : "password"}
                placeholder="Enter your current password"
                value={formData.previousPassword}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    previousPassword: e.target.value,
                  }));
                  setError("");
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    previousPassword: !prev.previousPassword,
                  }))
                }
              >
                {showPasswords.previousPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.newPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }));
                  setError("");
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    newPassword: !prev.newPassword,
                  }))
                }
              >
                {showPasswords.newPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }));
                  setError("");
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    confirmPassword: !prev.confirmPassword,
                  }))
                }
              >
                {showPasswords.confirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            className="cursor-pointer"
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="cursor-pointer"
            type="button"
            onClick={handleChangePassword}
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
