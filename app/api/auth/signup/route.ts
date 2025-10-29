import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { generateOTP } from "@/lib/otpgenerator";
import { sendMail } from "@/lib/mailer";
import { signUpSchema } from "@/lib/validation/signUpschema";
import { otpEmailTemplate } from "@/app/email-template/otpEmailTemplate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsedData = signUpSchema.safeParse(body);

    if (!parsedData.success) {
      const errorMessages = parsedData.error;
      return NextResponse.json(
        { success: false, errors: errorMessages },
        { status: 400 },
      );
    }
    const { email, username, password } = parsedData.data;

    if (!email || !username || !password) {
      return NextResponse.json(
        { message: "All fields required" },
        { status: 400 },
      );
    }

    const existingUser = await db.user.findFirst({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already Exist" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        otp,
        otpExpiry,
      },
    });

    // Send OTP email
    await sendMail({
      to: email,
      subject: "Verify your email - ArcMindAI",
      html: otpEmailTemplate(otp, username),
    });

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
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
