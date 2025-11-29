import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { grievanceFormSchema } from "@/lib/validation/grievanceFormSchema";
import { sendMail } from "@/lib/mailer";
import { getGrievanceEmailTemplate } from "@/components/email-template/grievanceEmailTemplate";
import { db } from "@/lib/prisma";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
  databaseQueryDurationSeconds,
} from "@/lib/metrics";

export async function POST(req: NextRequest) {
  const route = "/api/grievance";
  const method = "POST";
  const end = httpRequestDurationSeconds.startTimer({ route });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      httpRequestsTotal.inc({ route, method, status_code: "401" });
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validation = grievanceFormSchema.safeParse(body);
    if (!validation.success) {
      httpRequestsTotal.inc({ route, method, status_code: "400" });
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed. Please check your inputs.",
        },
        { status: 400 },
      );
    }

    // Fetch user details
    const db1Start = Date.now();
    const user = await db.user.findFirst({
      where: {
        // @ts-expect-error id is added to the session in the session callback
        id: session.user.id,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - db1Start) / 1000,
    );

    if (!user) {
      httpRequestsTotal.inc({ route, method, status_code: "404" });
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    if (!user.isVerified) {
      httpRequestsTotal.inc({ route, method, status_code: "401" });
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      return NextResponse.json(
        { success: false, error: "User not Verfied" },
        { status: 401 },
      );
    }

    const dbStart = Date.now();
    await db.user.update({
      where: {
        // @ts-expect-error id is added to the session in the session callback
        id: session.user.id,
      },
      data: {
        subscriptionStatus: "cancelled",
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbStart) / 1000,
    );

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

    httpRequestsTotal.inc({ route, method, status_code: "200" });
    end();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error submitting grievance:", err);
    httpRequestsTotal.inc({ route, method, status_code: "500" });
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit grievance. Please try again.",
      },
      { status: 500 },
    );
  }
}
