"use server";

import { sendMail } from "@/lib/mailer";
import { contactFormSchema } from "@/lib/validation/contactFormSchema";
import { getContactEmailTemplate } from "@/components/email-template/contactEmailTemplate";

export async function submitContactForm(formData: FormData) {
  const data = {
    firstname: formData.get("firstname") as string,
    lastname: formData.get("lastname") as string,
    email: formData.get("email") as string,
    message: formData.get("message") as string,
    agree: formData.get("agree") === "on",
  };

  const validation = contactFormSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed. Please check your inputs.",
    };
  }

  try {
    const emailPayload = getContactEmailTemplate(validation.data);
    await sendMail({
      to: process.env.ADMIN_EMAIL!,
      ...emailPayload,
    });
    return { success: true };
  } catch (err) {
    console.error("Error sending email:", err);
    return { success: false, error: "Failed to send email. Please try again." };
  }
}
