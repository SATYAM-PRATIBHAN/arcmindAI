import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Generation ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { rating } = body;

    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    // Look up the generation and join the owner's email via the `user` relation
    // Generation.userId (ObjectId) → User.id, User.email matches session
    const generation = await prisma.generation.findUnique({
      where: { id },
      select: {
        id: true,
        user: { select: { email: true } },
      },
    });

    if (!generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    if (generation.user.email !== session.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.generation.update({
      where: { id },
      data: { rating },
      select: { id: true, rating: true },
    });

    return NextResponse.json({ success: true, generation: updated });
  } catch (error) {
    console.error("[RATING_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}