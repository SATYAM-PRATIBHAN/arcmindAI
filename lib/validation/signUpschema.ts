import { z } from "zod";

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

  password: z
    .string()
    .min(6, "Password must be atleast 6 characters")
    .regex(/[a-z]/, "Password must contain atleast one lowercase letter")
    .regex(/[A-Z]/, "Password must contain atleast one uppercase letter")
    .regex(/[0-9]/, "Password must contain atleast one number"),
});

export type SignUpSchema = z.infer<typeof signUpSchema>;
