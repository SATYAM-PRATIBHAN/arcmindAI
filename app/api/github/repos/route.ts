import { NextResponse } from "next/server";
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

export async function GET() {
  const startTime = Date.now();
  const route = "/api/github/repos";
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

    httpRequestsTotal.inc({ route, method, status_code: "200" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000
    );
  } catch (err) {
    console.error("Error fetching GitHub repos:", err);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000
    );
    return NextResponse.json(
      {
        success: false,
        message:
          err instanceof Error ? err.message : "Failed to fetch repositories",
      },
      { status: 500 }
    );
  }
}
