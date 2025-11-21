import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../[...nextauth]/route";
import { db } from "@/lib/prisma";
import bcrypt from "bcrypt";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  databaseQueryDurationSeconds,
  userLastActivityTimestamp,
  apiGatewayErrorsTotal,
} from "@/lib/metrics";

export async function POST(req: NextRequest) {
  const route = "/api/auth/updatePassword";
  const method = "POST";
  const end = httpRequestDurationSeconds.startTimer({ route });

  try {
    const session = await getServerSession(authOptions);
    const { previousPassword, newPassword } = await req.json();

    if (!previousPassword || !newPassword) {
      httpRequestsTotal.inc({ route, method, status_code: "400" });
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      end();
      return NextResponse.json(
        { status: 400, message: "Inputs not provided" },
        { status: 400 },
      );
    }

    // @ts-expect-error id has been added to session in nextauth
    if (!session?.user?.id) {
      httpRequestsTotal.inc({ route, method, status_code: "401" });
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      end();
      return NextResponse.json(
        { status: 401, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Update user last activity

    userLastActivityTimestamp.set(
      // @ts-expect-error id has been added to session in nextauth
      { user_id: session.user.id },
      Date.now() / 1000,
    );

    const dbEnd = databaseQueryDurationSeconds.startTimer({
      operation: "findFirst",
    });
    const user = await db.user.findFirst({
      where: {
        // @ts-expect-error id has been added to session in nextauth
        id: session?.user?.id,
      },
    });
    dbEnd();

    if (!user) {
      httpRequestsTotal.inc({ route, method, status_code: "404" });
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      end();
      return NextResponse.json(
        { status: 404, message: "User not found" },
        { status: 404 },
      );
    }

    const isValid = await bcrypt.compare(previousPassword, user.password);
    if (!isValid) {
      httpRequestsTotal.inc({ route, method, status_code: "401" });
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      end();
      return NextResponse.json(
        { status: 401, message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    const dbEnd2 = databaseQueryDurationSeconds.startTimer({
      operation: "update",
    });
    await db.user.update({
      where: {
        // @ts-expect-error id has been added to session in nextauth
        id: session?.user?.id,
      },
      data: {
        password: newHashedPassword,
      },
    });
    dbEnd2();

    httpRequestsTotal.inc({ route, method, status_code: "200" });
    end();
    return NextResponse.json({
      success: true,
      output: "Password updated Successfully",
    });
  } catch (err) {
    console.error(err);
    httpRequestsTotal.inc({ route, method, status_code: "500" });
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    end();
    return NextResponse.json(
      {
        status: false,
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
