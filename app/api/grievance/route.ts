import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { grievanceFormSchema } from "@/lib/validation/grievanceFormSchema";
import { sendMail } from "@/lib/mailer";
import { getGrievanceEmailTemplate } from "@/components/email-template/grievanceEmailTemplate";
import { db } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validation = grievanceFormSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed. Please check your inputs.",
        },
        { status: 400 },
      );
    }

    // Fetch user details
    const user = await db.user.findFirst({
      where: {
        // @ts-expect-error id is added to the session in the session callback
        id: session.user.id,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { success: false, error: "User not Verfied" },
        { status: 401 },
      );
    }

    await db.user.update({
      where: {
        // @ts-expect-error id is added to the session in the session callback
        id: session.user.id,
      },
      data: {
        subscriptionStatus: "cancelled",
      },
    });

    // Prepare email data
    const emailData = {
      ...validation.data,
      userEmail: user.email,
      username: user.username,
    };

    const emailPayload = getGrievanceEmailTemplate(emailData);
    await sendMail({
      to: "armindai@gmail.com",
      ...emailPayload,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error submitting grievance:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit grievance. Please try again.",
      },
      { status: 500 },
    );
  }
}
