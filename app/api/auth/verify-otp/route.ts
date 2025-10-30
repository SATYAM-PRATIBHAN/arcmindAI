import { welcomeEmailTemplate } from "@/components/email-template/welcomeEmailTemplate";
import { sendMail } from "@/lib/mailer";
import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and OTP are required" },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: {
        email,
      },
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

    if (!user.otp || !user.otpExpiry) {
      return NextResponse.json(
        { message: "OTP not found or expired" },
        { status: 400 },
      );
    }

    if (new Date() > user.otpExpiry) {
      return NextResponse.json({ message: "OTP has expired" }, { status: 400 });
    }

    if (user.otp !== otp) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    // Update user as verified and clear OTP
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

    await sendMail({
      to: user.email,
      subject: "Welcome to arcmindAI",
      html: welcomeEmailTemplate(user.username),
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
