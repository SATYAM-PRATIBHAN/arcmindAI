import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getCacheKey, withCache } from "@/lib/cache";
import { decryptToken } from "@/lib/encryption";
import { db } from "@/lib/prisma";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const CACHE_TTL_SECONDS = 60 * 60;

// Configurable safeguards with sane defaults
const MAX_SCANNED_FILES = parseInt(process.env.MAX_SCANNED_FILES || "1000", 10);
const MAX_DIRECTORY_DEPTH = parseInt(
  process.env.MAX_DIRECTORY_DEPTH || "5",
  10,
);

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size?: number;
  url: string;
}

interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
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

    const rawData = await withCache(
      getCacheKey("github:repo-tree", userId, owner, repo, branch),
      CACHE_TTL_SECONDS,
      async () => {
        const response = await axios.get<GitHubTreeResponse>(
          `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          },
        );
        return response.data;
      },
    );

    // --- Safeguard Logic Start ---
    const processedTree: GitHubTreeItem[] = [];
    let isTruncatedByLimit = false;
    let fileCount = 0;

    for (const item of rawData.tree) {
      // 1. Check Depth Limit (Count slashes in path: "src/components/ui" -> depth 2)
      const currentDepth = item.path.split("/").filter(Boolean).length - 1;
      if (currentDepth > MAX_DIRECTORY_DEPTH) {
        isTruncatedByLimit = true;
        continue; // Skip this file/folder if it's too deep
      }

      // 2. Check Max Files Limit
      if (item.type === "blob") {
        // GitHub uses 'blob' for files
        if (fileCount >= MAX_SCANNED_FILES) {
          isTruncatedByLimit = true;
          break; // Stop processing entirely if file limit reached
        }
        fileCount++;
      }

      processedTree.push(item);
    }

    // Prepare clear message for user if something was skipped
    const isTruncatedOverall = rawData.truncated || isTruncatedByLimit;
    const warningMessage = isTruncatedOverall
      ? `Repository analysis was truncated for performance. Limits applied: Max ${MAX_SCANNED_FILES} files, Max ${MAX_DIRECTORY_DEPTH} folder depth.`
      : null;

    // --- Safeguard Logic End ---

    return NextResponse.json({
      success: true,
      truncated: isTruncatedOverall,
      message: warningMessage,
      data: {
        ...rawData,
        tree: processedTree,
      },
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
