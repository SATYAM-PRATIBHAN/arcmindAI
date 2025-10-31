"use client";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { SearchForm } from "@/components/search-form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useGetUserHistory } from "@/app/(protected)/generate/hooks/useGetUserHistory";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { history } = useGetUserHistory();
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  const filteredHistory = history.filter((gen) =>
    (gen.systemName || gen.userInput)
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const data = {
    navMain: [
      {
        title: "Getting Started",
        items: [
          {
            title: "New Chat",
            url: "/generate",
            isActive: pathname === "/generate",
          },
          {
            title: "About us",
            url: "#",
          },
        ],
      },
      {
        title: "Previous Chats",
        url: "#",
        items: filteredHistory.map((gen) => ({
          title: gen.systemName || gen.userInput,
          url: `/generate/${gen.id}`,
          isActive: pathname === `/generate/${gen.id}`,
        })),
      },
    ],
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        {/* @ts-expect-error: setSearchQuery (from useState) signature does not exactly match SearchForm's onChange prop, but is safe here */}
        <SearchForm value={searchQuery} onChange={setSearchQuery} />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {data.navMain.map((item) => (
          <Collapsible
            key={item.title}
            title={item.title}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              >
                <CollapsibleTrigger>
                  {item.title}{" "}
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.items.map((item: any) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={item.isActive}>
                          <Link href={item.url}>{item.title}</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
