import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcrypt";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
  databaseQueryDurationSeconds,
} from "@/lib/metrics";

export async function GET(req: Request) {
  const startTime = Date.now();
  const route = "/api/auth/reset-password";
  const method = "GET";
  httpRequestsTotal.inc({ route, method });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const dbStart = Date.now();
    const resetEntry = await db.resetPasswordToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbStart) / 1000,
    );

    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json({ valid: !!resetEntry });
  } catch (error) {
    console.error("Error in GET reset-password:", error);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const startTime = Date.now();
  const route = "/api/auth/reset-password";
  const method = "POST";
  httpRequestsTotal.inc({ route, method });

  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json({
        status: 400,
        message: "Token and password are required",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const dbFindStart = Date.now();
    const resetEntry = await db.resetPasswordToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbFindStart) / 1000,
    );

    if (!resetEntry) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json({
        status: 400,
        message: "Invalid or Expired token",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    const dbUpdateStart = Date.now();
    await db.user.update({
      where: { id: resetEntry.userId },
      data: { password: hashedPassword },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "update" },
      (Date.now() - dbUpdateStart) / 1000,
    );

    // Remove used token
    const dbDeleteStart = Date.now();
    await db.resetPasswordToken.delete({
      where: { id: resetEntry.id },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "delete" },
      (Date.now() - dbDeleteStart) / 1000,
    );

    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json({ message: "Password reset successful!" });
  } catch (error) {
    console.error("Error in reset-password:", error);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
