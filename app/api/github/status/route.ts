import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { connected: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has a GitHub access token
    const user = await db.user.findUnique({
      where: {
        // @ts-expect-error id is added in jwt callback
        id: session.user.id,
      },
      select: {
        githubAccessToken: true,
      },
    });

    return NextResponse.json({
      connected: !!user?.githubAccessToken,
    });
  } catch (err) {
    console.error("Error checking GitHub status:", err);
    return NextResponse.json(
      { connected: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
