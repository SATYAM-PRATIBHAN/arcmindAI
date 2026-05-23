import DodoPayments from "dodopayments";

const isDodoConfigured =
  !!process.env.DODO_PAYMENTS_API_KEY &&
  !process.env.DODO_PAYMENTS_API_KEY.includes("dummy");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dodopaymentsInstance: any;

if (isDodoConfigured) {
  dodopaymentsInstance = new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    environment: "live_mode",
  });
} else {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[paymentHandler] Dodo Payments API key not configured — using simulated billing client.",
    );
  }
  dodopaymentsInstance = {
    products: {
      list: async () => ({
        items: [
          {
            product_id: "prod_dummy_monthly",
            name: "Monthly Subscriptions",
          },
          {
            product_id: "prod_dummy_yearly",
            name: "Yearly Subscriptions",
          },
        ],
      }),
    },
    checkoutSessions: {
      create: async () => ({
        checkout_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/payment/success?session_id=sess_dummy`,
        session_id: "sess_dummy",
      }),
    },
    subscriptions: {
      retrieve: async (id: string) => ({
        id,
        next_billing_date: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      }),
    },
  };
}

const dodopayments = dodopaymentsInstance as DodoPayments;
export default dodopayments;
