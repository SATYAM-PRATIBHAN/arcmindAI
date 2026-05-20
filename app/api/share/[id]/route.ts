import { httpRequestsTotal, httpRequestDurationSeconds } from "@/lib/metrics";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const { id } = await params;

  const route = "/api/share/[id]";
  const method = "GET";

  httpRequestsTotal.inc({ route, method });
  try {
    const generation = await db.generation.findFirst({
      where: {
        shareId: id,
        isPublic: true,
      },
    });

    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 },
      );
    }

    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json(generation);
  } catch (error) {
    console.error(error);

    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
