import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/prisma";
import { decryptToken } from "@/lib/encryption";
import { RepositoryAnalyzer } from "@/lib/repository-analyzer";
import {
  AnalyzeRepositoryRequest,
  AnalyzeRepositoryResponse,
} from "@/types/repository-analysis";

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
        { status: 401 }
      );
    }

    const body: AnalyzeRepositoryRequest = await request.json();
    const { owner, repo } = body;

    if (!owner || !repo) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: owner or repo",
        } as AnalyzeRepositoryResponse,
        { status: 400 }
      );
    }

    // Get user's encrypted GitHub token from database
    const user = await db.user.findUnique({
      where: {
        // @ts-expect-error id is added in jwt callback
        id: session.user.id,
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
        { status: 403 }
      );
    }

    // Decrypt the token
    const githubToken = decryptToken(user.githubAccessToken);

    // Create analyzer and run analysis
    const analyzer = new RepositoryAnalyzer(owner, repo, githubToken);
    const analysis = await analyzer.analyze();

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
      { status: 500 }
    );
  }
}
