"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { DashedLine } from "../dashed-line";
import { cn } from "@/lib/utils";

const topItems = [
  {
    title: "Generate intelligent architectures instantly.",
    description:
      "Turn simple product ideas into complete, production-ready system designs powered by AI reasoning.",
    images: [
      {
        src: "/features/systemGeneration.webp",
        alt: "AI architecture generation interface",
        width: 495,
        height: 186,
      },
    ],
    className:
      "flex-1 [&>.title-container]:mb-5 md:[&>.title-container]:mb-8 xl:[&>.image-container]:translate-x-6 [&>.image-container]:translate-x-2",
  },
  {
    title: "Unify your entire tech stack planning.",
    description:
      "Eliminate scattered documentation — ArcMindAI brings architecture, tech stack, and data flow into one unified view.",
    images: [
      { src: "/logos/nextjs.svg", alt: "Next.js", width: 48, height: 48 },
      { src: "/logos/nestjs.svg", alt: "NestJS", width: 48, height: 48 },
      { src: "/logos/graphql.svg", alt: "GraphQL", width: 48, height: 48 },
      { src: "/logos/redis.svg", alt: "Redis", width: 48, height: 48 },
      { src: "/logos/mongodb.svg", alt: "MongoDB", width: 48, height: 48 },
      { src: "/logos/aws.svg", alt: "AWS", width: 48, height: 48 },
      {
        src: "/logos/kubernetes.svg",
        alt: "Kubernetes",
        width: 48,
        height: 48,
      },
      {
        src: "/logos/postgresql.svg",
        alt: "PostgreSQL",
        width: 48,
        height: 48,
      },
    ],
    className:
      "flex-1 [&>.title-container]:mb-5 md:[&>.title-container]:mb-8 md:[&>.title-container]:translate-x-2 xl:[&>.title-container]:translate-x-4 [&>.title-container]:translate-x-0",
  },
];

const bottomItems = [
  {
    title: "Download architectural diagrams.",
    description:
      "Export your generated system architectures as high-quality diagrams for documentation, presentations, or team sharing.",
    images: [
      {
        src: "/features/systemArchitecture4.webp",
        alt: "Architecture refinement interface",
        width: 305,
        height: 280,
      },
    ],
    className:
      "[&>.title-container]:mb-5 md:[&>.title-container]:mb-4 md:[&>.image-container]:mb-4 [&>.image-container]:translate-x-2",
  },
  {
    title: "Get your custom system design delivered to your inbox.",
    description:
      "Request your tailored architecture and receive a complete design directly in your email — fast, private, and ready to use.",
    images: [
      {
        src: "/features/notificationStack.webp",
        alt: "System design sent via email interface",
        width: 320,
        height: 103,
      },
    ],
    className:
      "justify-normal [&>.title-container]:mb-5 md:[&>.title-container]:-mb-4 [&>.image-container]:flex-1 md:[&>.image-container]:place-items-center ",
  },
  {
    title: "View past architectures",
    description:
      "Access your previously generated system designs instantly — revisit, review, and reuse past architecture creations without starting from scratch.",
    images: [
      {
        src: "/features/chatHistory.webp",
        alt: "Architecture collaboration interface",
        width: 305,
        height: 280,
      },
    ],
    className:
      "[&>.title-container]:mb-5 md:[&>.title-container]:mb-6 md:[&>.image-container]:mb-2 [&>.image-container]:translate-x-2",
  },
];

export const Features = () => {
  return (
    <section
      id="features"
      className="container mx-auto overflow-hidden pb-24 lg:pb-28"
    >
      <div className="px-4 max-w-5xl mx-auto">
        <h2 className="container mx-auto font-semibold text-center text-3xl tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-6xl">
          Accelerate your system design process with arcmindAI
        </h2>

        <div className="mt-8 md:mt-12 lg:mt-20">
          <DashedLine
            orientation="horizontal"
            className="container scale-x-105"
          />

          {/* Top Features Grid */}
          <div className="relative container flex max-md:flex-col">
            {topItems.map((item, i) => (
              <Item key={i} item={item} isLast={i === topItems.length - 1} />
            ))}
          </div>
          <DashedLine
            orientation="horizontal"
            className="container max-w-7xl scale-x-110"
          />

          {/* Bottom Features Grid */}
          <div className="relative container grid max-w-7xl md:grid-cols-3">
            {bottomItems.map((item, i) => (
              <Item
                key={i}
                item={item}
                isLast={i === bottomItems.length - 1}
                className="md:pb-0"
              />
            ))}
          </div>
        </div>
        <DashedLine
          orientation="horizontal"
          className="container max-w-7xl scale-x-110"
        />
      </div>
    </section>
  );
};

interface ItemProps {
  item: (typeof topItems)[number] | (typeof bottomItems)[number];
  isLast?: boolean;
  className?: string;
}

const Item = ({ item, isLast, className }: ItemProps) => {
  return (
    <motion.div
      className={cn(
        "relative flex flex-col justify-between px-0 py-8 md:px-6 md:py-8",
        className,
        item.className,
      )}
      variants={{
        hidden: { opacity: 0, y: 40, scale: 0.98 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.6, ease: "easeOut" },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="title-container text-balance">
        <h3 className="inline font-semibold">{item.title} </h3>
        <span className="text-muted-foreground"> {item.description}</span>
      </div>

      {item.images.length > 4 ? (
        <div className="image-container relative overflow-hidden">
          <div className="flex flex-col gap-5">
            {/* First row */}
            <div className="flex translate-x-4 justify-end gap-5">
              {item.images.slice(0, 4).map((image, j) => (
                <motion.div
                  key={j}
                  variants={{
                    hidden: { opacity: 0, scale: 0.8, y: 20 },
                    visible: {
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      transition: { duration: 0.4, delay: j * 0.05 },
                    },
                  }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-background grid aspect-square size-16 place-items-center rounded-2xl p-2 lg:size-20"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    className="object-contain object-top-left"
                  />
                </motion.div>
              ))}
            </div>
            {/* Second row */}
            <div className="flex -translate-x-4 gap-5">
              {item.images.slice(4).map((image, j) => (
                <motion.div
                  key={j}
                  variants={{
                    hidden: { opacity: 0, scale: 0.8, y: 20 },
                    visible: {
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      transition: { duration: 0.4, delay: j * 0.05 },
                    },
                  }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-background grid aspect-square size-16 place-items-center rounded-2xl lg:size-20"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    className="object-contain object-top-left"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          className="image-container grid grid-cols-1 gap-4"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.5, ease: "easeOut" },
            },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {item.images.map((image, j) => (
            <Image
              key={j}
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="object-contain object-top-left rounded-2xl"
            />
          ))}
        </motion.div>
      )}

      {!isLast && (
        <>
          <DashedLine
            orientation="vertical"
            className="absolute top-0 right-0 max-md:hidden"
          />
          <DashedLine
            orientation="horizontal"
            className="absolute inset-x-0 bottom-0 md:hidden"
          />
        </>
      )}
    </motion.div>
  );
};
