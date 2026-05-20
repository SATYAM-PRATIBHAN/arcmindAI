import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getCacheKey, withCache } from "@/lib/cache";
import { decryptToken } from "@/lib/encryption";
import { db } from "@/lib/prisma";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const CACHE_TTL_SECONDS = 60 * 60;

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
    const path = searchParams.get("path");
    const branch = searchParams.get("branch");

    if (!owner || !repo || !path) {
      return NextResponse.json(
        { success: false, message: "Missing owner, repo, or path parameter" },
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

    // Check if file is an image
    const isImage = /\.(png|jpg|jpeg|gif|svg|webp|bmp|ico)$/i.test(path);

    // @ts-expect-error id is added in jwt callback
    const userId = session.user.id as string;

    const cacheData = await withCache(
      getCacheKey(
        "github:file-content",
        userId,
        owner,
        repo,
        path,
        branch || "",
      ),
      CACHE_TTL_SECONDS,
      async () => {
        // Fetch file content from GitHub
        const response = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github.raw",
            },
            params: branch ? { ref: branch } : undefined,
            responseType: isImage ? "arraybuffer" : "text",
          },
        );

        if (isImage) {
          // Return binary data as base64 for images
          const base64 = Buffer.from(response.data).toString("base64");
          const mimeType = getMimeType(path);
          return {
            content: `data:${mimeType};base64,${base64}`,
            isImage: true,
          };
        } else {
          // Return text content
          return {
            content: response.data,
            isImage: false,
          };
        }
      },
    );

    return NextResponse.json({
      success: true,
      data: cacheData.content,
      isImage: cacheData.isImage,
    });
  } catch (err) {
    console.error("Error fetching file content:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          err instanceof Error ? err.message : "Failed to fetch file content",
      },
      { status: 500 },
    );
  }
}

function getMimeType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    bmp: "image/bmp",
    ico: "image/x-icon",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}
