import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // @ts-expect-error id is added to the session in the session callback
    const userId = session.user.id;
    const body = await req.json().catch(() => null);

    if (!body || !body.userInput || !body.generatedOutput) {
      return NextResponse.json(
        { success: false, error: "Missing required transfer fields: 'userInput' and 'generatedOutput'." },
        { status: 400 }
      );
    }

    const { userInput, generatedOutput } = body;

    // Create the generation in the database
    const newGeneration = await db.generation.create({
      data: {
        userInput,
        generatedOutput,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      generation: newGeneration,
    });
  } catch (error: unknown) {
    console.error("Error transferring guest generation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Failed to transfer guest generation.", details: errorMessage },
      { status: 500 }
    );
  }
}
