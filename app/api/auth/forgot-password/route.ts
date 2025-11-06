import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import crypto from "crypto";
import { sendMail } from "@/lib/mailer";
import { forgotPasswordEmailTemplate } from "@/components/email-template/forgotPasswordEmailTemplate";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
  databaseQueryDurationSeconds,
} from "@/lib/metrics";

export async function POST(req: Request) {
  const startTime = Date.now();
  const route = "/api/auth/forgot-password";
  const method = "POST";
  httpRequestsTotal.inc({ route, method });

  try {
    const { email } = await req.json();

    if (!email) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }

    const dbStart = Date.now();
    const user = await db.user.findFirst({ where: { email } });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbStart) / 1000,
    );

    if (!user) {
      // Don't reveal if user exists or not for security
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json({
        message: "If that email exists, we sent a reset link.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // store token in DB
    const dbCreateStart = Date.now();
    await db.resetPasswordToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "create" },
      (Date.now() - dbCreateStart) / 1000,
    );

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password?token=${rawToken}`;

    await sendMail({
      to: email,
      subject: "Reset Your Password - ArcMindAI",
      html: forgotPasswordEmailTemplate(user.username, resetUrl),
    });

    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json({ message: "Reset link sent." });
  } catch (err) {
    console.error(err);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );
    return NextResponse.json({ status: 500, message: "Internal server error" });
  }
}
