import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  databaseQueryDurationSeconds,
  userLastActivityTimestamp,
  apiGatewayErrorsTotal,
  cacheHitsTotal,
} from "@/lib/metrics";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  const route = "/api/user";
  const method = "GET";
  const end = httpRequestDurationSeconds.startTimer({ route });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      httpRequestsTotal.inc({ route, method, status_code: "401" });
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      end();
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Update user last activity

    userLastActivityTimestamp.set(
      // @ts-expect-error id is added to the session in the session callback
      { user_id: session.user.id },
      Date.now() / 1000,
    );

    // Increment cache hits (assuming fetching user profile is a cache hit if cached)
    cacheHitsTotal.inc();

    const dbEnd = databaseQueryDurationSeconds.startTimer({
      operation: "findFirst",
    });
    const user = await db.user.findFirst({
      where: {
        // @ts-expect-error id is added to the session in the session callback
        id: session?.user?.id,
      },
    });
    dbEnd();

    if (!user) {
      httpRequestsTotal.inc({ route, method, status_code: "404" });
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      end();
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    httpRequestsTotal.inc({ route, method, status_code: "200" });
    end();
    return NextResponse.json({
      success: true,
      output: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        avatar: user.avatar,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    httpRequestsTotal.inc({ route, method, status_code: "500" });
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    end();
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const route = "/api/user";
  const method = "PUT";
  const end = httpRequestDurationSeconds.startTimer({ route });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      httpRequestsTotal.inc({ route, method, status_code: "401" });
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      end();
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const formData = await req.formData();
    const username = formData.get("username") as string | null;
    const avatarFile = formData.get("avatar") as File | null;

    let avatarUrl: string | undefined;

    if (avatarFile) {
      // Upload to Cloudinary
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "arcmindAI" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(buffer);
      });

      // @ts-expect-error Cloudinary result type
      avatarUrl = uploadResult.secure_url;
    }

    const updateData: { username?: string; avatar?: string } = {};
    if (username) updateData.username = username;
    if (avatarUrl) updateData.avatar = avatarUrl;

    if (Object.keys(updateData).length === 0) {
      httpRequestsTotal.inc({ route, method, status_code: "400" });
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      end();
      return NextResponse.json(
        { success: false, message: "No fields to update" },
        { status: 400 },
      );
    }

    // Update user last activity
    userLastActivityTimestamp.set(
      // @ts-expect-error id is added to the session in the session callback
      { user_id: session.user.id },
      Date.now() / 1000,
    );

    const dbEnd = databaseQueryDurationSeconds.startTimer({
      operation: "update",
    });
    const updatedUser = await db.user.update({
      where: {
        // @ts-expect-error id is added to the session in the session callback
        id: session?.user?.id,
      },
      data: updateData,
    });
    dbEnd();

    httpRequestsTotal.inc({ route, method, status_code: "200" });
    end();
    return NextResponse.json({
      success: true,
      output: {
        id: updatedUser.id,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        email: updatedUser.email,
        isVerified: updatedUser.isVerified,
      },
    });
  } catch (err) {
    console.error("Error updating user:", err);
    httpRequestsTotal.inc({ route, method, status_code: "500" });
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    end();
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
