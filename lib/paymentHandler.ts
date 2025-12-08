import DodoPayments from "dodopayments";

const dodopayments = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: "live_mode",
});

export default dodopayments;
