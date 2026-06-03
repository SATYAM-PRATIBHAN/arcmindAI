import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // @ts-expect-error custom session user id
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // @ts-expect-error custom session user id
    const userId = session.user.id;

    const deliveries = await db.webhookDelivery.findMany({
      where: {
        webhook: {
          userId,
        },
      },

      include: {
        webhook: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      deliveries,
    });
  } catch (error) {
    console.error("Error fetching delivery history:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
