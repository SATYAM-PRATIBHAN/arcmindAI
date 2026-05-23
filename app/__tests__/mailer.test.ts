import { describe, it, expect } from "vitest";
import { sendMail } from "@/lib/mailer";

describe("Mailer Graceful Fallback", () => {
  it("should intercept and return mock success when credentials are dummy", async () => {
    // In our test environment, GOOGLE_CLIENT_ID etc are dummy/not configured
    const result = await sendMail({
      to: "test@example.com",
      subject: "Test Subject",
      text: "Test body content",
    });

    expect(result).toBeDefined();
    expect(result.messageId).toBe("simulated-id");
    expect(result.response).toBe("250 OK");
  });
});
