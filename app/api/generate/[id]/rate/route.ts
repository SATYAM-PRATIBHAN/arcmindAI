import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added in session callback
    const userId = session?.user?.id as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Generation ID is required" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body.rating !== "number") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { rating } = body;

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    const generation = await db.generation.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 },
      );
    }

    await db.generation.update({
      where: {
        id,
      },
      data: {
        rating,
      },
    });

    return NextResponse.json({
      success: true,
      rating,
    });
  } catch (error) {
    console.error("Error saving generation rating:", error);

    return NextResponse.json(
      {
        error: "Failed to save rating",
      },
      { status: 500 },
    );
  }
}
