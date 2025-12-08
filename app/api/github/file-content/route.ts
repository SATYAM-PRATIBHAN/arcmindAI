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
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const path = searchParams.get("path");

    if (!owner || !repo || !path) {
      return NextResponse.json(
        { success: false, message: "Missing owner, repo, or path parameter" },
        { status: 400 }
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
        { status: 403 }
      );
    }

    // Decrypt the token
    const githubToken = decryptToken(user.githubAccessToken);

    // Check if file is an image
    const isImage = /\.(png|jpg|jpeg|gif|svg|webp|bmp|ico)$/i.test(path);

    // Fetch file content from GitHub
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: isImage
            ? "application/vnd.github.raw"
            : "application/vnd.github.raw",
        },
        responseType: isImage ? "arraybuffer" : "text",
      }
    );

    if (isImage) {
      // Return binary data as base64 for images
      const base64 = Buffer.from(response.data).toString("base64");
      const mimeType = getMimeType(path);
      return NextResponse.json({
        success: true,
        data: `data:${mimeType};base64,${base64}`,
        isImage: true,
      });
    } else {
      // Return text content
      return NextResponse.json({
        success: true,
        data: response.data,
        isImage: false,
      });
    }
  } catch (err) {
    console.error("Error fetching file content:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          err instanceof Error ? err.message : "Failed to fetch file content",
      },
      { status: 500 }
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
