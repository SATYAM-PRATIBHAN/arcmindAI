import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),

  username: z
    .string()
    .min(3, "Username must be atleast 3 characters")
    .max(20, "Username too long"),

  password: passwordSchema,
});

export type SignUpSchema = z.infer<typeof signUpSchema>;

export function validatePassword(password: string): string | null {
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    return result.error.issues[0]?.message ?? "Invalid password";
  }
  return null;
}
