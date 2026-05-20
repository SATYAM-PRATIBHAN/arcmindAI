import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getCacheKey, withCache } from "@/lib/cache";
import { decryptToken } from "@/lib/encryption";
import { db } from "@/lib/prisma";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const CACHE_TTL_SECONDS = 60 * 10;

interface GithubBranch {
  name: string;
  commit: { sha: string; url: string };
  protected: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");

    if (!owner || !repo) {
      return NextResponse.json(
        { success: false, message: "Missing owner or repo parameter" },
        { status: 400 },
      );
    }

    // @ts-expect-error id is added in jwt callback
    const userId = session.user.id as string;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { githubAccessToken: true },
    });

    if (!user?.githubAccessToken) {
      return NextResponse.json(
        { success: false, message: "GitHub not connected" },
        { status: 403 },
      );
    }

    const githubToken = decryptToken(user.githubAccessToken);

    const branches = await withCache<GithubBranch[]>(
      getCacheKey("github:branches", userId, owner, repo),
      CACHE_TTL_SECONDS,
      async () => {
        const response = await axios.get<GithubBranch[]>(
          `https://api.github.com/repos/${owner}/${repo}/branches`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github.v3+json",
            },
            params: { per_page: 100, page: 1 },
          },
        );

        return response.data;
      },
    );

    return NextResponse.json({ success: true, branches });
  } catch (err) {
    console.error("Error fetching GitHub branches:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          err instanceof Error ? err.message : "Failed to fetch branches",
      },
      { status: 500 },
    );
  }
}
