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

    if (!generation.githubGeneration) {
      return NextResponse.json(
        { success: false, message: "No GitHub generation found for this ID" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: generation.id,
        mermaidCode: generation.githubGeneration,
        userInput: generation.userInput,
        createdAt: generation.createdAt,
        updatedAt: generation.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching GitHub generation:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
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
    const { mermaidCode } = await request.json();

    if (!mermaidCode || typeof mermaidCode !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid Mermaid code provided" },
        { status: 400 },
      );
    }

    // Verify generation exists and belongs to user
    const existingGeneration = await db.generation.findFirst({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id,
      },
    });

    if (!existingGeneration) {
      return NextResponse.json(
        { success: false, message: "Generation not found" },
        { status: 404 },
      );
    }

    // Update the generation
    const updatedGeneration = await db.generation.update({
      where: {
        id: generationId,
      },
      data: {
        githubGeneration: mermaidCode,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedGeneration.id,
        mermaidCode: updatedGeneration.githubGeneration,
        updatedAt: updatedGeneration.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating GitHub generation:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
