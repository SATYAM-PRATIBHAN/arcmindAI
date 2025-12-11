"use client";
import { useState, useEffect } from "react";
import { ChevronRight, LogOut } from "lucide-react";
import { SearchForm } from "@/components/search-form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useHistory } from "@/lib/contexts/HistoryContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { DOC_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useGetUser, User } from "@/hooks/useGetUser";
import Image from "next/image";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { history, isLoading } = useHistory();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const { getUser } = useGetUser();

  const filteredHistory = history.filter((gen) =>
    (gen.systemName || gen.userInput)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUser();
      if (userData?.success) {
        setUser(userData?.output);
      }
    };
    if (session) {
      fetchUser();
    }
  }, [session]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutDialogOpen(false);
    }
  };

  const data = {
    navMain: [
      {
        title: "Getting Started",
        items: [
          {
            title: "New Chat",
            url: DOC_ROUTES.GENERATE,
            isActive: pathname === DOC_ROUTES.GENERATE,
          },
          {
            title: "Import Project",
            url: DOC_ROUTES.IMPORT.ROOT,
          },
        ],
      },
      {
        title: "Previous Chats",
        items: isLoading
          ? Array.from({ length: 10 }).map((_, i) => ({
              // placeholder entries
              title: `loading-${i}`,
              url: "#",
              isLoading: true,
            }))
          : filteredHistory.map((gen) => ({
              title: gen.systemName || gen.userInput,
              url: `/generate/${gen.id}`,
              isActive: pathname === `/generate/${gen.id}`,
            })),
      },
    ],
  };

  return (
    <Sidebar variant="floating" {...props}>
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
                    {item.items.map(
                      (
                        item: {
                          title: string;
                          url: string;
                          isActive?: boolean;
                          isLoading?: boolean;
                        },
                        index: number
                      ) => (
                        <SidebarMenuItem key={index}>
                          {item.isLoading ? (
                            <div className="animate-pulse flex items-center gap-2 px-3 py-2">
                              <div className="h-3 w-3 rounded-full bg-muted"></div>
                              <div className="h-3 flex-1 rounded bg-muted"></div>
                            </div>
                          ) : (
                            <SidebarMenuButton asChild isActive={item.isActive}>
                              <Link href={item.url}>{item.title}</Link>
                            </SidebarMenuButton>
                          )}
                        </SidebarMenuItem>
                      )
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    variant="ghost"
                    className="cursor-pointer w-full justify-start"
                    asChild
                  >
                    <Link
                      href={DOC_ROUTES.PROFILE.ROOT}
                      className="flex items-center"
                    >
                      <div
                        className={cn(
                          "relative w-6 h-6 aspect-square rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium mr-2",
                          user?.plan === "custom" && "ring-1 ring-yellow-500"
                        )}
                      >
                        {user?.avatar ? (
                          <Image
                            src={user.avatar}
                            alt="avatar"
                            width={24}
                            height={24}
                            className="rounded-full object-cover w-6 h-6"
                          />
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-black text-xs font-bold uppercase">
                            {session?.user?.name?.charAt(0).toUpperCase() ||
                              "U"}
                          </span>
                        )}
                        {user?.plan === "pro" && (
                          <span className="absolute -top-0.5 -right-0.5 bg-yellow-500 text-white text-[5px] border-black px-1 py-0.5 rounded">
                            PRO
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-medium">
                          {session?.user?.name || "User"}
                        </span>
                      </div>
                    </Link>
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <Dialog
                open={isLogoutDialogOpen}
                onOpenChange={setIsLogoutDialogOpen}
              >
                <DialogTrigger asChild>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Button
                        variant="ghost"
                        className="cursor-pointer w-full justify-start"
                      >
                        <LogOut className="cursor-pointer mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Logout</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to log out? You will be redirected
                      to the home page.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsLogoutDialogOpen(false)}
                      disabled={isLoggingOut}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="cursor-pointer"
                    >
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
