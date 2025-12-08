"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { DOC_ROUTES } from "@/lib/routes";

export function useGithubToken() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkGithubStatus = async () => {
      try {
        const res = await axios.get(DOC_ROUTES.API.GITHUB.STATUS);
        setIsConnected(res.data.connected);
      } catch (error) {
        console.error("Error checking GitHub status:", error);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    checkGithubStatus();
  }, []);

  return { isConnected, loading };
}
