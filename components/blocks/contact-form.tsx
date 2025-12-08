"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  contactFormSchema,
  type ContactFormSchema,
} from "@/lib/validation/contactFormSchema";
import { submitContactForm } from "@/actions/contact";

type FormValues = ContactFormSchema;

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      message: "",
      agree: false,
    },
  });

  const handleSubmit = form.handleSubmit(async (data: FormValues) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("firstname", data.firstname);
      formData.append("lastname", data.lastname);
      formData.append("email", data.email);
      formData.append("message", data.message);
      formData.append("agree", data.agree ? "on" : "off");

      const result = await submitContactForm(formData);

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || "Submission failed. Please try again.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  });

  if (submitted) {
    return (
      <div className="w-full gap-2 rounded-md border p-2 sm:p-5 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, stiffness: 300, damping: 25 }}
          className="h-full px-3 py-6"
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 500,
              damping: 15,
            }}
            className="mx-auto mb-4 flex w-fit justify-center rounded-full border p-2"
          >
            <Check className="size-8" />
          </motion.div>
          <h2 className="mb-2 text-center text-2xl font-bold text-pretty">
            Thank you
          </h2>
          <p className="text-muted-foreground text-center text-lg text-pretty">
            Form submitted successfully, we will get back to you soon
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit}
        className="flex w-full lg:w-2xl flex-col gap-2 space-y-4 rounded-md"
      >
        {error && (
          <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {/* First Name */}
        <FormField
          control={form.control}
          name="firstname"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>First name *</FormLabel>
              <FormControl>
                <Input type="text" {...field} placeholder="First name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Last Name */}
        <FormField
          control={form.control}
          name="lastname"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Last name *</FormLabel>
              <FormControl>
                <Input type="text" {...field} placeholder="Last name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Email address *</FormLabel>
              <FormControl>
                <Input type="email" {...field} placeholder="me@example.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Message */}
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your message *</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Write your message"
                  className="resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Terms */}
        <FormField
          control={form.control}
          name="agree"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 space-x-1">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>I agree to the terms and conditions</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex w-full items-center justify-end pt-3">
          <Button
            className="rounded-lg"
            size="sm"
            type="submit"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
