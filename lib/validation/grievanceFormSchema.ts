import { z } from "zod";

export const grievanceFormSchema = z.object({
  rating: z.string().min(1, "Please select a rating"),
  reason: z.string().min(1, "Reason for cancellation is required"),
  agree: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

export type GrievanceFormData = z.infer<typeof grievanceFormSchema>;
