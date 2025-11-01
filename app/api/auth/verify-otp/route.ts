import { welcomeEmailTemplate } from "@/components/email-template/welcomeEmailTemplate";
import { sendMail } from "@/lib/mailer";
import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
  databaseQueryDurationSeconds,
  userLastActivityTimestamp,
} from "@/lib/metrics";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const route = "/api/auth/verify-otp";
  const method = "POST";
  httpRequestsTotal.inc({ route, method });

  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { message: "Email and OTP are required" },
        { status: 400 },
      );
    }

    const dbStart = Date.now();
    const user = await db.user.findUnique({
      where: {
        email,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findUnique" },
      (Date.now() - dbStart) / 1000,
    );

    if (!user) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { message: "User is already verified" },
        { status: 400 },
      );
    }

    if (!user.otp || !user.otpExpiry) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { message: "OTP not found or expired" },
        { status: 400 },
      );
    }

    if (new Date() > user.otpExpiry) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json({ message: "OTP has expired" }, { status: 400 });
    }

    if (user.otp !== otp) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    // Update user as verified and clear OTP
    const dbUpdateStart = Date.now();
    await db.user.update({
      where: {
        email,
      },
      data: {
        isVerified: true,
        otp: null,
        otpExpiry: null,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "update" },
      (Date.now() - dbUpdateStart) / 1000,
    );

    // Update user activity
    userLastActivityTimestamp.set({ user_id: user.id }, Date.now() / 1000);

    await sendMail({
      to: user.email,
      subject: "Welcome to arcmindAI",
      html: welcomeEmailTemplate(user.username),
    });

    // Track total HTTP duration
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (e) {
    console.error(e);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
