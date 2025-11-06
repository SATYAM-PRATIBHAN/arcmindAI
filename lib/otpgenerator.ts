import crypto from "crypto";

export function generateOTP(): string {
  // Generate 6 cryptographically secure random bytes, then convert to 6-digit number
  const randomBytes = crypto.randomBytes(3); // 3 bytes = 24 bits, enough for 6 digits (20 bits needed)
  const otp = parseInt(randomBytes.toString("hex"), 16) % 1000000; // Modulo for 6 digits
  return otp.toString().padStart(6, "0"); // Pad to ensure 6 digits
}
