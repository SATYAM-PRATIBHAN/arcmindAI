"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { useHistory } from "@/lib/contexts/HistoryContext";
import { DOC_ROUTES } from "@/lib/routes";
import Link from "next/link";

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { history } = useHistory();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push(DOC_ROUTES.AUTH.LOGIN);
    }
  }, [session, status, router]);

  if (!session) {
    return null;
  }

  // Generate breadcrumbs based on current path and sidebar data
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split("/").filter(Boolean);

    if (pathname === DOC_ROUTES.GENERATE) {
      return (
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>New Chat</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
    }

    if (pathname.startsWith("/generate/")) {
      const id = pathSegments[1];
      const generation = history.find((gen) => gen.id === id);
      const title = generation
        ? generation.systemName || generation.userInput
        : `Generation ${id}`;

      return (
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href={DOC_ROUTES.GENERATE}>Generate</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
    }

    return (
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage>New Chat</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    );
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>{generateBreadcrumbs()}</Breadcrumb>
          </div>
          <div className="flex gap-4">
            <Link
              href={DOC_ROUTES.HOME}
              className="text-xs md:text-sm text-gray-600 hover:text-black transition underline"
            >
              ← Back to Home
            </Link>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
