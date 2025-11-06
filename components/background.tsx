import React from "react";

import { cn } from "@/lib/utils";

type BackgroundProps = {
  children: React.ReactNode;
  variant?: "top" | "bottom";
  className?: string;
};

export const Background = ({
  children,
  variant = "top",
  className,
}: BackgroundProps) => {
  return (
    <div
      className={cn(
        "relative mx-2.5 mt-2.5 lg:mx-4",
        variant === "top" &&
          "from-primary/50 via-background to-background/80 rounded-t-4xl rounded-b-2xl bg-linear-to-b via-20%",
        variant === "bottom" &&
          "from-background via-background to-primary/50 rounded-t-2xl rounded-b-4xl bg-linear-to-b",
        className,
      )}
    >
      {children}
    </div>
  );
};
