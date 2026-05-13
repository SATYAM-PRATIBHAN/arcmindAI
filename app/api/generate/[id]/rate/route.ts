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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const route = "/api/generate/[id]/rate";
  const method = "POST";
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: generationId } = await params;
    const body = await request.json();
    const { rating } = body;

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Invalid rating value. Must be between 1 and 5." },
        { status: 400 },
      );
    }

    // Update user activity
    userLastActivityTimestamp.set(
      // @ts-expect-error id is added to the session in the session callback
      { user_id: session.user.id },
      Date.now() / 1000,
    );

    const dbStart = Date.now();
    
    // Check if generation exists and belongs to user
    const existingGeneration = await db.generation.findFirst({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id,
      },
    });

    if (!existingGeneration) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Generation not found" },
        { status: 404 },
      );
    }

    const updatedGeneration = await db.generation.update({
      where: {
        id: generationId,
      },
      data: {
        rating: rating,
      },
    });
    
    databaseQueryDurationSeconds.observe(
      { operation: "update" },
      (Date.now() - dbStart) / 1000,
    );

    // Track total HTTP duration
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json({
      success: true,
      output: updatedGeneration,
    });
  } catch (error) {
    console.error("Error updating generation rating:", error);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
