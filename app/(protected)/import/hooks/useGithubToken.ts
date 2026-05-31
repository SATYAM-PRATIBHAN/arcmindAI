"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { DOC_ROUTES } from "@/lib/routes";

export function useGithubToken() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkGithubStatus = async () => {
      try {
        const res = await axios.get(DOC_ROUTES.API.GITHUB.STATUS);
        setIsConnected(res.data.connected);
      } catch (err) {
        console.error("Error checking GitHub status:", err);
        setIsConnected(false);
        setError("Failed to verify GitHub connection.");
      } finally {
        setLoading(false);
      }
    };

    checkGithubStatus();
  }, []);

  return { isConnected, loading, error };
}
