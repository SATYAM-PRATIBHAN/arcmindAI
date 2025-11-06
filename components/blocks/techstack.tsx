import Image from "next/image";
import Link from "next/link";
import { DashedLine } from "../dashed-line";

type Company = {
  name: string;
  logo: string;
  width: number;
  height: number;
  href: string;
};

export const Logos = () => {
  const topRowTechonologies = [
    {
      name: "TypeScript",
      logo: "/logos/typescript.svg",
      width: 80,
      height: 25,
      href: "https://www.typescriptlang.org/docs/",
    },
    {
      name: "Next.js",
      logo: "/logos/nextjs.svg",
      width: 80,
      height: 25,
      href: "https://nextjs.org/docs",
    },
    {
      name: "Redis",
      logo: "/logos/redis.svg",
      width: 80,
      height: 25,
      href: "https://redis.io/docs/",
    },
    {
      name: "MongoDB",
      logo: "/logos/mongodb.svg",
      width: 80,
      height: 25,
      href: "https://www.mongodb.com/docs/",
    },
  ];

  const bottomRowTechnologies = [
    {
      name: "Tailwind CSS",
      logo: "/logos/tailwindcss.svg",
      width: 85,
      height: 25,
      href: "https://tailwindcss.com/docs",
    },
    {
      name: "shadcn/ui",
      logo: "/logos/shadcn.svg",
      width: 85,
      height: 25,
      href: "https://ui.shadcn.com/docs",
    },
    {
      name: "React",
      logo: "/logos/reactjs.svg",
      width: 85,
      height: 25,
      href: "https://react.dev/learn",
    },
    {
      name: "LangChain",
      logo: "/logos/langchain.svg",
      width: 85,
      height: 25,
      href: "https://js.langchain.com/docs/",
    },
    {
      name: "Gemini AI",
      logo: "/logos/gemini.svg",
      width: 85,
      height: 25,
      href: "https://ai.google.dev/docs",
    },
  ];

  return (
    <section id="tech" className="pb-28 lg:pb-32 overflow-hidden">
      <div className="container space-y-10 lg:space-y-16">
        <div className="text-center">
          <h2 className="mb-4 text-xl text-balance md:text-2xl lg:text-3xl">
            Built with cutting-edge technologies.
            <br className="max-md:hidden" />
            <span className="text-muted-foreground">
              Fast, scalable, and designed for AI-driven architecture
              generation.
            </span>
          </h2>
        </div>

        <div className="flex w-full flex-col items-center gap-10">
          <LogoRow companies={topRowTechonologies} />
          <LogoRow companies={bottomRowTechnologies} direction="right" />
        </div>
      </div>

      <div className="relative flex items-center mt-28 justify-center">
        <DashedLine className="text-muted-foreground" />
        <span className="bg-muted text-muted-foreground absolute px-3 font-mono text-sm font-medium tracking-wide max-md:hidden">
          BLUEPRINT FIRST, BUILD BETTER
        </span>
      </div>
    </section>
  );
};

type LogoRowProps = {
  companies: Company[];
  direction?: "left" | "right";
};

const LogoRow = ({ companies }: LogoRowProps) => {
  return (
    <>
      {/* Desktop static grid */}
      <div className="hidden md:flex flex-wrap justify-center items-center gap-12">
        {companies.map((company, index) => (
          <Link
            href={company.href}
            target="_blank"
            key={index}
            className="flex flex-col items-center justify-center transition-opacity hover:opacity-100 opacity-80 dark:invert"
          >
            <Image
              src={company.logo}
              alt={`${company.name} logo`}
              width={company.width}
              height={company.height}
              className="object-contain"
            />
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {company.name}
            </p>
          </Link>
        ))}
      </div>

      {/* Mobile marquee */}
      <div className="md:hidden">
        {companies.map((company, index) => (
          <Link
            href={company.href}
            target="_blank"
            key={index}
            className="flex flex-col items-center justify-center transition-opacity hover:opacity-100 opacity-80 dark:invert"
          >
            <Image
              src={company.logo}
              alt={`${company.name} logo`}
              width={company.width}
              height={company.height}
              className="object-contain"
            />
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {company.name}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
};
