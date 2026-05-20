import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { register } from "@/lib/metrics";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const adminEmails = process.env.ADMIN_EMAIL?.split(",") ?? [];

    if (
      !session?.user?.email ||
      !adminEmails.includes(session.user.email)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const metrics = await register.metrics();
    return new NextResponse(metrics, {
      headers: {
        "Content-Type": register.contentType,
      },
    });
  } catch (error) {
    console.error("Error generating metrics:", error);
    return NextResponse.json(
      { error: "Failed to generate metrics" },
      { status: 500 },
    );
  }
}
