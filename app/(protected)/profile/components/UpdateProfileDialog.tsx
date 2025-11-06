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
import { Edit, User } from "lucide-react";

interface UpdateProfileDialogProps {
  onUpdateProfile: (formData: {
    username: string;
    avatar: File | null;
  }) => Promise<void>;
  isUpdatingProfile: boolean;
}

export function UpdateProfileDialog({
  onUpdateProfile,
  isUpdatingProfile,
}: UpdateProfileDialogProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    avatar: null as File | null,
  });

  const handleUpdateProfile = async () => {
    await onUpdateProfile(formData);
    setIsModalOpen(false);
    setFormData({ username: "", avatar: null });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      try {
        // Convert to WebP
        const webpFile = await convertToWebP(file);
        setFormData((prev) => ({ ...prev, avatar: webpFile }));
      } catch (error) {
        console.error("Failed to convert image to WebP:", error);
        // Fallback to original file if conversion fails
        setFormData((prev) => ({ ...prev, avatar: file }));
      }
    }
  };

  const convertToWebP = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context not available"));
            return;
          }
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const webpFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, ".webp"),
                  {
                    type: "image/webp",
                  },
                );
                resolve(webpFile);
              } else {
                reject(new Error("Failed to convert to WebP"));
              }
            },
            "image/webp",
            0.5,
          ); // Quality 0.5 for good compression
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer mt-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Edit className="w-4 h-4 mr-2" />
          Update Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="avatar">Avatar</Label>
            <label
              htmlFor="avatar"
              className="flex items-center gap-3 p-2 border border-dashed border-muted-foreground rounded-lg bg-muted cursor-pointer hover:bg-muted/60 transition-colors"
            >
              {formData.avatar ? (
                <span className="text-xs truncate max-w-[120px]">
                  {formData.avatar.name}
                </span>
              ) : (
                <>
                  <span className="inline-block bg-accent rounded-full p-1">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </span>
                  <span className="text-xs">Choose an avatar image...</span>
                </>
              )}
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter new username"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="cursor-pointer"
            type="button"
            variant="outline"
            onClick={() => setIsModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="cursor-pointer"
            type="button"
            onClick={handleUpdateProfile}
            disabled={isUpdatingProfile}
          >
            {isUpdatingProfile ? "Updating..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
