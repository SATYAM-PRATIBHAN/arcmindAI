import dodopayments from "@/lib/paymentHandler";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
} from "@/lib/metrics";

export async function GET() {
  const route = "/api/payment";
  const method = "GET";
  const end = httpRequestDurationSeconds.startTimer({ route });

  try {
    const product = await dodopayments.products.list();
    httpRequestsTotal.inc({ route, method, status_code: "200" });
    end();
    return NextResponse.json({ success: true, products: product.items });
  } catch (err) {
    console.error(err);
    httpRequestsTotal.inc({ route, method, status_code: "500" });
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    return NextResponse.json({
      status: 500,
      message: "Internal Server Error",
    });
  }
}

export async function POST(req: NextRequest) {
  const route = "/api/payment";
  const method = "POST";
  const end = httpRequestDurationSeconds.startTimer({ route });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      httpRequestsTotal.inc({ route, method, status_code: "401" });
      end();
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { billingPeriod, planName } = await req.json();

    const userId = (session.user as { id: string }).id;
    const userEmail = session.user?.email ?? "";
    const userName =
      session.user?.name || userEmail.split("@")[0] || "ArcmindAI user";

    if (!billingPeriod || !["monthly", "yearly"].includes(billingPeriod)) {
      httpRequestsTotal.inc({ route, method, status_code: "400" });
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      end();
      return NextResponse.json(
        {
          success: false,
          message: "Invalid billing period. Must be 'monthly' or 'yearly'",
        },
        { status: 400 },
      );
    }

    const normalizedPlan = (
      typeof planName === "string" ? planName : "pro"
    ).toLowerCase();

    const productsResponse = await dodopayments.products.list();
    const products = productsResponse.items;

    const productName =
      billingPeriod === "yearly"
        ? "Yearly Subscriptions"
        : "Monthly Subscriptions";

    const product = products.find(
      (p) =>
        typeof p.name === "string" &&
        (p.name === productName ||
          p.name.toLowerCase().includes(billingPeriod.toLowerCase())),
    );

    if (
      !product ||
      typeof product.product_id !== "string" ||
      product.product_id.length === 0
    ) {
      httpRequestsTotal.inc({ route, method, status_code: "404" });
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      end();
      return NextResponse.json(
        { success: false, message: `Product not found: ${productName}` },
        { status: 404 },
      );
    }

    const checkoutSession = (await dodopayments.checkoutSessions.create({
      product_cart: [
        {
          product_id: product.product_id,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        billingPeriod,
        planName: normalizedPlan,
        email: userEmail,
      },
      customer:
        userEmail.length > 0
          ? {
              email: userEmail,
              name: userName,
            }
          : undefined,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
    })) as { checkout_url?: string; session_id?: string };

    if (!checkoutSession?.checkout_url) {
      return NextResponse.json(
        { success: false, message: "Failed to create checkout session" },
        { status: 500 },
      );
    }

    httpRequestsTotal.inc({ route, method, status_code: "200" });
    end();
    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.checkout_url,
      sessionId: checkoutSession.session_id,
    });
  } catch (err) {
    console.error("Payment error:", err);
    httpRequestsTotal.inc({ route, method, status_code: "500" });
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
