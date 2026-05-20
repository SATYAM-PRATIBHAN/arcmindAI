import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getCacheKey, withCache } from "@/lib/cache";
import { decryptToken } from "@/lib/encryption";
import { db } from "@/lib/prisma";
import { RepositoryAnalyzer } from "@/lib/repository-analyzer";
import {
  AnalyzeRepositoryRequest,
  AnalyzeRepositoryResponse,
} from "@/types/repository-analysis";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const CACHE_TTL_SECONDS = 60 * 60;

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        } as AnalyzeRepositoryResponse,
        { status: 401 },
      );
    }

    const body: AnalyzeRepositoryRequest = await request.json();
    const { owner, repo, branch } = body;

    if (!owner || !repo) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: owner or repo",
        } as AnalyzeRepositoryResponse,
        { status: 400 },
      );
    }

    // @ts-expect-error id is added in jwt callback
    const userId = session.user.id;

    // Get user's encrypted GitHub token from database
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
        {
          success: false,
          error: "GitHub not connected",
        } as AnalyzeRepositoryResponse,
        { status: 403 },
      );
    }

    // Decrypt the token
    const githubToken = decryptToken(user.githubAccessToken);

    // Create analyzer and run analysis with caching
    const analysis = await withCache(
      getCacheKey("repository-analysis", userId, owner, repo, branch || ""),
      CACHE_TTL_SECONDS,
      async () => {
        const analyzer = new RepositoryAnalyzer(
          userId,
          owner,
          repo,
          githubToken,
          branch,
        );
        return await analyzer.analyze();
      },
    );

    return NextResponse.json({
      success: true,
      data: analysis,
    } as AnalyzeRepositoryResponse);
  } catch (error) {
    console.error("Repository analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze repository",
      } as AnalyzeRepositoryResponse,
      { status: 500 },
    );
  }
}
