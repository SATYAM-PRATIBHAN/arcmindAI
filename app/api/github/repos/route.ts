import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getCacheKey, withCache } from "@/lib/cache";
import { decryptToken } from "@/lib/encryption";
import { db } from "@/lib/prisma";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const CACHE_TTL_SECONDS = 60 * 60;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // @ts-expect-error id is added in jwt callback
    const userId = session.user.id as string;

    // Get user's encrypted GitHub token
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        githubAccessToken: true,
      },
    });

    if (!user?.githubAccessToken) {
      return NextResponse.json(
        { success: false, message: "GitHub not connected" },
        { status: 403 },
      );
    }

    // Decrypt the token
    const githubToken = decryptToken(user.githubAccessToken);

    const data = await withCache(
      getCacheKey("github:repos", userId),
      CACHE_TTL_SECONDS,
      async () => {
        // Fetch user's repositories from GitHub
        const response = await axios.get("https://api.github.com/user/repos", {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
          params: {
            sort: "updated",
            per_page: 100,
          },
        });
        return response.data;
      },
    );

    return NextResponse.json({
      success: true,
      repos: data,
    });
  } catch (err) {
    console.error("Error fetching GitHub repos:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          err instanceof Error ? err.message : "Failed to fetch repositories",
      },
      { status: 500 },
    );
  }
}
