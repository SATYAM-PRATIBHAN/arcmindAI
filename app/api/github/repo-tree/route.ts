import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/prisma";
import { decryptToken } from "@/lib/encryption";
import axios from "axios";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const branch = searchParams.get("branch");

    if (!owner || !repo || !branch) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing owner, repo, or branch parameter",
        },
        { status: 400 },
      );
    }

    // Get user's encrypted GitHub token
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
        { success: false, message: "GitHub not connected" },
        { status: 403 },
      );
    }

    // Decrypt the token
    const githubToken = decryptToken(user.githubAccessToken);

    // Fetch repository tree from GitHub
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (err) {
    console.error("Error fetching repo tree:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : "Failed to fetch repository tree",
      },
      { status: 500 },
    );
  }
}
