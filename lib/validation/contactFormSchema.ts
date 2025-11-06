import { z } from "zod";

export const contactFormSchema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
  message: z.string().min(1, "Message is required"),
  agree: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

export type ContactFormSchema = z.infer<typeof contactFormSchema>;
