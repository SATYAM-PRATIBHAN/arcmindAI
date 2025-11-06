import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  databaseQueryDurationSeconds,
  userLastActivityTimestamp,
  apiGatewayErrorsTotal,
  cacheHitsTotal,
} from "@/lib/metrics";

export async function GET() {
  const route = "/api/generate/history";
  const method = "GET";
  const end = httpRequestDurationSeconds.startTimer({ route });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      httpRequestsTotal.inc({ route, method, status_code: "401" });
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      end();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update user last activity
    userLastActivityTimestamp.set(
      // @ts-expect-error id is added to the session in the session callback
      { user_id: session.user.id },
      Date.now() / 1000,
    );

    // Increment cache hits (assuming fetching history is a cache hit if cached)
    cacheHitsTotal.inc();

    const dbEnd = databaseQueryDurationSeconds.startTimer({
      operation: "findFirst",
    });
    const user = await db.user.findFirst({
      where: {
        // @ts-expect-error id is added to the session in the session callback
        id: session?.user?.id,
      },
    });
    dbEnd();

    if (!user) {
      httpRequestsTotal.inc({ route, method, status_code: "404" });
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      end();
      return NextResponse.json(
        { status: 404, message: "User not Found" },
        { status: 404 },
      );
    }

    if (user?.isVerified === false) {
      httpRequestsTotal.inc({ route, method, status_code: "401" });
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      end();
      return NextResponse.json(
        { status: 401, message: "Email is not verified" },
        { status: 401 },
      );
    }

    const dbEnd2 = databaseQueryDurationSeconds.startTimer({
      operation: "findMany",
    });
    const generations = await db.generation.findMany({
      // @ts-expect-error id is added to the session in the session callback
      where: { userId: session.user.id },
      select: {
        id: true,
        userInput: true,
        createdAt: true,
        generatedOutput: true,
      },
      orderBy: { createdAt: "desc" },
    });
    dbEnd2();

    const transformedGenerations = generations.map((gen) => {
      const output = gen.generatedOutput as
        | { Explanation?: { systemName?: string } }
        | null
        | undefined;
      return {
        id: gen.id,
        userInput: gen.userInput,
        createdAt: gen.createdAt,
        systemName: output?.Explanation?.systemName || "",
      };
    });

    httpRequestsTotal.inc({ route, method, status_code: "200" });
    end();
    return NextResponse.json({ success: true, output: transformedGenerations });
  } catch (err) {
    console.error(err);
    httpRequestsTotal.inc({ route, method, status_code: "500" });
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    end();
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
