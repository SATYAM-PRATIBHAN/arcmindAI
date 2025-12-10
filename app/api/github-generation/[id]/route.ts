import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/prisma";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
  databaseQueryDurationSeconds,
  userLastActivityTimestamp,
} from "@/lib/metrics";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const route = "/api/github-generation/[id]";
  const method = "GET";
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update user activity
    userLastActivityTimestamp.set(
      // @ts-expect-error id is added to the session in the session callback
      { user_id: session.user.id },
      Date.now() / 1000
    );

    const { id: generationId } = await params;

    const dbStart = Date.now();
    const generation = await db.generation.findFirst({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbStart) / 1000
    );

    if (!generation) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json(
        { success: false, message: "Generation not found" },
        { status: 404 }
      );
    }

    if (!generation.githubGeneration) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json(
        { success: false, message: "No GitHub generation found for this ID" },
        { status: 404 }
      );
    }

    httpRequestsTotal.inc({ route, method, status_code: "200" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000
    );

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
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000
    );
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const route = "/api/github-generation/[id]";
  const method = "PUT";
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update user activity
    userLastActivityTimestamp.set(
      // @ts-expect-error id is added to the session in the session callback
      { user_id: session.user.id },
      Date.now() / 1000
    );

    const { id: generationId } = await params;
    const { mermaidCode } = await request.json();

    if (!mermaidCode || typeof mermaidCode !== "string") {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json(
        { success: false, message: "Invalid Mermaid code provided" },
        { status: 400 }
      );
    }

    // Verify generation exists and belongs to user
    const dbStart = Date.now();
    const existingGeneration = await db.generation.findFirst({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbStart) / 1000
    );

    if (!existingGeneration) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json(
        { success: false, message: "Generation not found" },
        { status: 404 }
      );
    }

    // Update the generation
    const dbStart2 = Date.now();
    const updatedGeneration = await db.generation.update({
      where: {
        id: generationId,
      },
      data: {
        githubGeneration: mermaidCode,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "update" },
      (Date.now() - dbStart2) / 1000
    );

    httpRequestsTotal.inc({ route, method, status_code: "200" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000
    );

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
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000
    );
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
