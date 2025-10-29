export function generateOTP(): string {
  // Generates a 6-digit OTP (100000–999999)
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}
