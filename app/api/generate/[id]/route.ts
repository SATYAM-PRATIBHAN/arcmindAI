import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: generationId } = await params;
    console.log("genration id: ", generationId);
    // @ts-expect-error id is added to the session in the session callback
    console.log("user id: ", session.user.id);

    const generation = await db.generation.findFirst({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id,
      },
    });

    if (!generation) {
      return NextResponse.json(
        { success: false, message: "Generation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      output: generation,
    });
  } catch (error) {
    console.error("Error fetching generation:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
