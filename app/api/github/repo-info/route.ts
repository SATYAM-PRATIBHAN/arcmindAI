import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/prisma";
import { decryptToken } from "@/lib/encryption";
import axios from "axios";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
  databaseQueryDurationSeconds,
  userLastActivityTimestamp,
} from "@/lib/metrics";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const route = "/api/github/repo-info";
  const method = "GET";
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update user activity
    userLastActivityTimestamp.set(
      // @ts-expect-error id is added in jwt callback
      { user_id: session.user.id },
      Date.now() / 1000
    );

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");

    if (!owner || !repo) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json(
        { success: false, message: "Missing owner or repo parameter" },
        { status: 400 }
      );
    }

    // Get user's encrypted GitHub token
    const dbStart = Date.now();
    const user = await db.user.findUnique({
      where: {
        // @ts-expect-error id is added in jwt callback
        id: session.user.id,
      },
      select: {
        githubAccessToken: true,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findUnique" },
      (Date.now() - dbStart) / 1000
    );

    if (!user?.githubAccessToken) {
      apiGatewayErrorsTotal.inc({ status_code: "403" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json(
        { success: false, message: "GitHub not connected" },
        { status: 403 }
      );
    }

    // Decrypt the token
    const githubToken = decryptToken(user.githubAccessToken);

    // Fetch repository info from GitHub
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (err) {
    console.error("Error fetching repo info:", err);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000
    );
    return NextResponse.json(
      {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : "Failed to fetch repository info",
      },
      { status: 500 }
    );
  }
}
