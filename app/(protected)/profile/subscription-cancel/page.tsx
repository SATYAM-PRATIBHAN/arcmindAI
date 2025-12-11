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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  grievanceFormSchema,
  type GrievanceFormData,
} from "@/lib/validation/grievanceFormSchema";
import { DashedLine } from "@/components/dashed-line";
import { useSubmitGrievance } from "@/hooks/useSubmitGrievance";

export default function SubscriptionCancelPage() {
  const [submitted, setSubmitted] = useState(false);
  const { submitGrievance, isLoading, error } = useSubmitGrievance();
  const form = useForm<GrievanceFormData>({
    resolver: zodResolver(grievanceFormSchema),
    defaultValues: {
      rating: "",
      reason: "",
      agree: false,
    },
  });

  const handleSubmit = form.handleSubmit(async (data: GrievanceFormData) => {
    const result = await submitGrievance(data);
    if (result.success) {
      setSubmitted(true);
    }
  });

  if (submitted) {
    return (
      <section className="py-28 lg:py-32 lg:pt-44">
        <div className="container max-w-2xl mx-auto">
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
                Your cancellation request has been submitted. We will get back
                to you soon.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-28 lg:py-32 lg:pt-44">
      <div className="container max-w-2xl mx-auto">
        <h1 className="text-center text-2xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
          Cancel Subscription
        </h1>
        <p className="text-muted-foreground mt-4 text-center leading-snug font-medium lg:mx-auto">
          We&apos;re sorry to see you go. Please provide your feedback and
          reason for cancellation.
        </p>

        <DashedLine className="my-12" />

        {/* Cancellation Form */}
        <div className="mx-auto">
          <h2 className="mb-4 text-lg font-semibold">Cancellation Request</h2>
          <Form {...form}>
            <form
              onSubmit={handleSubmit}
              className="flex w-full lg:w-2xl flex-col gap-2 space-y-4 rounded-md border p-2 sm:p-5 md:p-8"
            >
              {error && (
                <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {/* Rating */}
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>How would you rate your experience? *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a rating" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 - Very Poor</SelectItem>
                        <SelectItem value="2">2 - Poor</SelectItem>
                        <SelectItem value="3">3 - Average</SelectItem>
                        <SelectItem value="4">4 - Good</SelectItem>
                        <SelectItem value="5">5 - Excellent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for cancellation *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Please provide the reason for cancelling your subscription"
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
                        className="cursor-pointer"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I agree to the{" "}
                        <a
                          href="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline hover:text-primary/80"
                        >
                          Terms and Conditions
                        </a>
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex w-full items-center justify-end pt-3">
                <Button
                  className="rounded-lg cursor-pointer"
                  size="sm"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit Cancellation"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
