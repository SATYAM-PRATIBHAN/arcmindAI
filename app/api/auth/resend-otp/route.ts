import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateOTP } from "@/lib/otpgenerator";
import { sendMail } from "@/lib/mailer";
import { otpEmailTemplate } from "@/app/email-template/otpEmailTemplate";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "User is already verified" },
        { status: 400 },
      );
    }

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

    return NextResponse.json({
      success: true,
      message: "New OTP sent to your email",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
