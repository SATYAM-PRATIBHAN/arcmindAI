import { sendMail } from "@/lib/mailer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { to, subject, text, html } = await req.json();
    await sendMail({ to, subject, text, html });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({
      success: false,
      status: 500,
      message: "Failed to send email",
    });
  }
}
