import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/prisma";
import { decryptToken } from "@/lib/encryption";
import axios from "axios";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
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

    return NextResponse.json({
      success: true,
      repos: response.data,
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
