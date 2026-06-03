import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to session in NextAuth callbacks
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: "Email is not verified" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { userInput, generatedOutput } = body;

    if (!userInput || !generatedOutput) {
      return NextResponse.json(
        { error: "Missing userInput or generatedOutput" },
        { status: 400 },
      );
    }

    const generation = await db.generation.create({
      data: {
        userInput,
        generatedOutput: generatedOutput as Prisma.InputJsonValue,
        userId: userId as string,
      },
    });

    return NextResponse.json({ success: true, id: generation.id });
  } catch (error) {
    console.error("Error saving generation:", error);
    return NextResponse.json(
      { error: "Failed to save generation" },
      { status: 500 },
    );
  }
}
