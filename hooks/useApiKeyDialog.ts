"use client";

import { useState } from "react";

export function useApiKeyDialog() {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);

  return {
    isOpen,
    openDialog,
    closeDialog,
  };
}
