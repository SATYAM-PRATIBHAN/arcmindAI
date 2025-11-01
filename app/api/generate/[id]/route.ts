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
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const route = '/api/generate/[id]';
  const method = 'GET';
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      apiGatewayErrorsTotal.inc({ status_code: '401' });
      httpRequestDurationSeconds.observe({ route }, (Date.now() - startTime) / 1000);
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: generationId } = await params;

    // Update user activity
    // @ts-expect-error id is added to the session in the session callback
    userLastActivityTimestamp.set({ user_id: session.user.id }, Date.now() / 1000);

    const dbStart = Date.now();
    const generation = await db.generation.findFirst({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id,
      },
    });
    databaseQueryDurationSeconds.observe({ operation: 'findFirst' }, (Date.now() - dbStart) / 1000);

    if (!generation) {
      apiGatewayErrorsTotal.inc({ status_code: '404' });
      httpRequestDurationSeconds.observe({ route }, (Date.now() - startTime) / 1000);
      return NextResponse.json(
        { success: false, message: "Generation not found" },
        { status: 404 },
      );
    }

    // Track total HTTP duration
    httpRequestDurationSeconds.observe({ route }, (Date.now() - startTime) / 1000);

    return NextResponse.json({
      success: true,
      output: generation,
    });
  } catch (error) {
    console.error("Error fetching generation:", error);
    apiGatewayErrorsTotal.inc({ status_code: '500' });
    httpRequestDurationSeconds.observe({ route }, (Date.now() - startTime) / 1000);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const route = '/api/generate/[id]';
  const method = 'DELETE';
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      apiGatewayErrorsTotal.inc({ status_code: '401' });
      httpRequestDurationSeconds.observe({ route }, (Date.now() - startTime) / 1000);
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: generationId } = await params;

    // Update user activity
    // @ts-expect-error id is added to the session in the session callback
    userLastActivityTimestamp.set({ user_id: session.user.id }, Date.now() / 1000);

    const dbStart = Date.now();
    const generation = await db.generation.delete({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id
      }
    })
    databaseQueryDurationSeconds.observe({ operation: 'delete' }, (Date.now() - dbStart) / 1000);

    if(!generation) {
      apiGatewayErrorsTotal.inc({ status_code: '404' });
      httpRequestDurationSeconds.observe({ route }, (Date.now() - startTime) / 1000);
      return NextResponse.json(
        { success: false, message: "Generation not found" },
        { status: 404 }
      )
    }

    // Track total HTTP duration
    httpRequestDurationSeconds.observe({ route }, (Date.now() - startTime) / 1000);

    return NextResponse.json({
      success: true,
      output: generation,
    });
  } catch(error) {
    console.error("Error fetching generation:", error);
    apiGatewayErrorsTotal.inc({ status_code: '500' });
    httpRequestDurationSeconds.observe({ route }, (Date.now() - startTime) / 1000);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}