import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  // @ts-expect-error id is added to the session in the session callback
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const generations = await db.generation.findMany({
      // @ts-expect-error id is added to the session in the session callback
      where: { userId: session.user.id },
      select: {
        id: true,
        userInput: true,
        createdAt: true,
        generatedOutput: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const transformedGenerations = generations.map((gen) => ({
      id: gen.id,
      userInput: gen.userInput,
      createdAt: gen.createdAt,
      systemName: (gen.generatedOutput as any)?.Explanation?.systemName || "",
    }));

    return NextResponse.json({ success: true, output: transformedGenerations });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
