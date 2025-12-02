import Link from "next/link";
import { GithubIcon, Linkedin, Twitter } from "lucide-react";
import { ContactForm } from "@/components/blocks/contact-form";
import { DashedLine } from "@/components/dashed-line";
import { DOC_ROUTES } from "@/lib/routes";

const contactInfo = [
  {
    title: "Email us",
    content: (
      <div className="mt-3">
        <div className="mt-1">
          <Link
            href={`mailto:${process.env.ADMIN_EMAIL}`}
            className="text-muted-foreground hover:text-foreground"
          >
            {process.env.ADMIN_EMAIL}
          </Link>
        </div>
      </div>
    ),
  },
  {
    title: "Follow us",
    content: (
      <div className="mt-3 flex gap-6 lg:gap-10">
        <Link
          href={DOC_ROUTES.SOCIAL.GITHUB}
          className="text-muted-foreground hover:text-foreground"
        >
          <GithubIcon className="size-5" />
        </Link>
        <Link
          href={DOC_ROUTES.SOCIAL.X}
          className="text-muted-foreground hover:text-foreground"
        >
          <Twitter className="size-5" />
        </Link>
        <Link
          href={DOC_ROUTES.SOCIAL.LINKEDIN}
          className="text-muted-foreground hover:text-foreground"
        >
          <Linkedin className="size-5" />
        </Link>
      </div>
    ),
  },
];

export default function Contact() {
  return (
    <section className="px-6 py-28 lg:py-32 lg:pt-44">
      <div className="container max-w-2xl">
        <h1 className="text-center text-2xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
          Contact us
        </h1>
        <p className="text-muted-foreground mt-4 text-center leading-snug font-medium lg:mx-auto">
          Have any issues or doubts in your mind? We&apos;re here to help.
        </p>

        <div className="mt-10 flex justify-between gap-8 max-sm:flex-col md:mt-14 lg:mt-20 lg:gap-12">
          {contactInfo.map((info, index) => (
            <div key={index}>
              <h2 className="font-medium">{info.title}</h2>
              {info.content}
            </div>
          ))}
        </div>

        <DashedLine className="my-12" />

        {/* Inquiry Form */}
        <div className="mx-auto">
          <h2 className="mb-4 text-lg font-semibold">Inquiries</h2>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
