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
import { useGetUserHistory } from "./hooks/useGetUserHistory";

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { history } = useGetUserHistory();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  // Generate breadcrumbs based on current path and sidebar data
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split("/").filter(Boolean);

    if (pathname === "/generate") {
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
            <BreadcrumbLink href="/generate">Generate</BreadcrumbLink>
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
        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>{generateBreadcrumbs()}</Breadcrumb>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
