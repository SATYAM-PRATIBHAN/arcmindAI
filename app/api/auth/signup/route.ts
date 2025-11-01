import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { generateOTP } from "@/lib/otpgenerator";
import { sendMail } from "@/lib/mailer";
import { signUpSchema } from "@/lib/validation/signUpschema";
import { otpEmailTemplate } from "@/components/email-template/otpEmailTemplate";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
  databaseQueryDurationSeconds,
  userLastActivityTimestamp,
} from "@/lib/metrics";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const route = "/api/auth/signup";
  const method = "POST";
  httpRequestsTotal.inc({ route, method });

  try {
    const body = await req.json();
    const parsedData = signUpSchema.safeParse(body);

    if (!parsedData.success) {
      const errorMessages = parsedData.error;
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, errors: errorMessages },
        { status: 400 },
      );
    }
    const { email, username, password } = parsedData.data;

    if (!email || !username || !password) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { message: "All fields required" },
        { status: 400 },
      );
    }

    const dbFindStart = Date.now();
    const existingUser = await db.user.findFirst({
      where: {
        email,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbFindStart) / 1000,
    );

    if (existingUser) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { message: "User already Exist" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const dbCreateStart = Date.now();
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        otp,
        otpExpiry,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "create" },
      (Date.now() - dbCreateStart) / 1000,
    );

    // Update user activity
    userLastActivityTimestamp.set({ user_id: user.id }, Date.now() / 1000);

    // Send OTP email
    await sendMail({
      to: email,
      subject: "Verify your email - ArcMindAI",
      html: otpEmailTemplate(otp, username),
    });

    // Track total HTTP duration
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json({
      success: true,
      message: "User created. Please check your email for verification code.",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
      },
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
