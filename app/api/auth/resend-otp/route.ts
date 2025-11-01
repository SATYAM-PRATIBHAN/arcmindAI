import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateOTP } from "@/lib/otpgenerator";
import { sendMail } from "@/lib/mailer";
import { otpEmailTemplate } from "@/components/email-template/otpEmailTemplate";
import { otpRateLimit } from "@/lib/rateLimit";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
  userLastActivityTimestamp,
} from "@/lib/metrics";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const route = '/api/auth/resend-otp';
  const method = 'POST';
  httpRequestsTotal.inc({ route, method });

  try {
    const { email } = await req.json();

    if (!email) {
      apiGatewayErrorsTotal.inc({ status_code: '400' });
      httpRequestDurationSeconds.observe({ route }, (Date.now() - startTime) / 1000);
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      apiGatewayErrorsTotal.inc({ status_code: '404' });
      httpRequestDurationSeconds.observe({ route }, (Date.now() - startTime) / 1000);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      apiGatewayErrorsTotal.inc({ status_code: '400' });
      httpRequestDurationSeconds.observe({ route }, (Date.now() - startTime) / 1000);
      return NextResponse.json(
        { message: "User is already verified" },
        { status: 400 },
      );
    }

    const { success, limit, remaining, reset } = await otpRateLimit.limit(user.id);
    if (!success) {
      apiGatewayErrorsTotal.inc({ status_code: '429' });
      httpRequestDurationSeconds.observe({ route }, (Date.now() - startTime) / 1000);
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait 1 minute before making another request." },
        { status: 429 },
      );
    }

    // Update user activity
    userLastActivityTimestamp.set({ user_id: user.id }, Date.now() / 1000);

    const newOtp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await db.user.update({
      where: { email },
      data: {
        otp: newOtp,
        otpExpiry,
      },
    });

    // Send new OTP email
    await sendMail({
      to: email,
      subject: "Verify your email - ArcMindAI",
      html: otpEmailTemplate(newOtp, user.username),
    });

    // Track total HTTP duration
    httpRequestDurationSeconds.observe({ route }, (Date.now() - startTime) / 1000);

    return NextResponse.json({
      success: true,
      message: "New OTP sent to your email",
      limit: limit,
      remaining: remaining,
      reset: reset
    });
  } catch (e) {
    console.error(e);
    apiGatewayErrorsTotal.inc({ status_code: '500' });
    httpRequestDurationSeconds.observe({ route }, (Date.now() - startTime) / 1000);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
