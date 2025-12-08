"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Github, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { DOC_ROUTES } from "@/lib/routes";
import { useGetUser, User } from "@/hooks/useGetUser";

const ITEMS = [
  {
    label: "Miscellaneous",
    dropdownItems: [
      {
        title: "Privacy Policy",
        href: DOC_ROUTES.PRIVACY_POLICY,
        description:
          "Learn about our privacy policy and how we handle your data.",
      },
      {
        title: "Features",
        href: `${DOC_ROUTES.HOME}#features`,
        description:
          "Explore app features: architecture generation, feedback, visualizations, export, and more.",
      },
    ],
  },
  { label: "About Us", href: DOC_ROUTES.ABOUT },
  { label: "Pricing", href: DOC_ROUTES.PRICING },
  { label: "Contact", href: DOC_ROUTES.CONTACT },
  {
    label: "Generate",
    dropdownItems: [
      {
        title: "Generate",
        href: DOC_ROUTES.GENERATE,
        description: "Generate arcitecture diagrams through single prompt",
      },
      {
        title: "GitHub Import",
        href: DOC_ROUTES.IMPORT.ROOT,
        description:
          "Generate architecture diagrams through your github repository",
      },
    ],
  },
];

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { getUser } = useGetUser();
  const isAuthenticated = status === "authenticated";
  const [user, setUser] = useState<User | null>(null);

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

  return (
    <section
      className={cn(
        "bg-background/70 absolute left-1/2 z-50 w-[min(90%,800px)] -translate-x-1/2 rounded-4xl border backdrop-blur-md transition-all duration-300",
        "top-5 lg:top-12",
      )}
    >
      <div className="flex items-center justify-between px-6 py-3">
        <Link
          href={DOC_ROUTES.HOME}
          className="flex shrink-0 items-center gap-2"
        >
          <Image
            src="/logos/fullLogo.svg"
            alt="logo"
            width={120}
            height={100}
            className="dark:invert"
          />
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="max-lg:hidden">
          <NavigationMenuList>
            {ITEMS.map((link) =>
              link.dropdownItems ? (
                <NavigationMenuItem key={link.label} className="">
                  <NavigationMenuTrigger className="data-[state=open]:bg-accent/50 bg-transparent! px-1.5">
                    {link.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="w-[400px] space-y-2 p-4">
                      {link.dropdownItems.map((item) => (
                        <li key={item.title}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={item.href}
                              className="cursor-pointer group hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex items-center gap-4 rounded-md p-3 leading-none no-underline outline-hidden transition-colors select-none"
                            >
                              <div className="space-y-1.5 transition-transform duration-300 group-hover:translate-x-1">
                                <div className="text-sm leading-none font-medium">
                                  {item.title}
                                </div>
                                <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                                  {item.description}
                                </p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem key={link.label} className="cursor-pointer">
                  <Link
                    href={link.href}
                    className={cn(
                      "relative bg-transparent px-1.5 text-sm font-medium transition-opacity hover:opacity-75",
                      pathname === link.href && "text-muted-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                </NavigationMenuItem>
              ),
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2.5">
          {isAuthenticated ? (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="data-[state=open]:bg-accent/50 bg-transparent! px-1.5 [&>svg]:hidden">
                    <div
                      className={cn(
                        "relative cursor-pointer flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground text-sm",
                        user?.plan === "custom" && "ring-2 ring-yellow-500",
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
                          {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                      )}
                      {user?.plan === "pro" && (
                        <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[7px] border-black px-0.5 py-0.5 rounded">
                          PRO
                        </span>
                      )}
                    </div>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="left-0 right-auto lg:left-auto lg:right-0">
                    <ul className="w-[150px] space-y-1 p-2">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href={DOC_ROUTES.PROFILE.ROOT}
                            className="cursor-pointer group hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex items-center justify-start rounded-md p-2 leading-none no-underline outline-hidden transition-colors select-none"
                          >
                            <div className="space-y-1 transition-transform duration-300 group-hover:translate-x-1">
                              <div className="text-sm leading-none font-medium flex items-start gap-2">
                                <UserIcon className="h-4 w-4" />
                                Profile
                              </div>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="cursor-pointer group hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex items-center justify-start rounded-md p-2 leading-none no-underline outline-hidden transition-colors select-none w-full text-left"
                          >
                            <div className="space-y-1 transition-transform duration-300 group-hover:translate-x-1">
                              <div className="text-sm leading-none font-medium flex items-start gap-2 text-red-600">
                                <LogOut className="h-4 w-4" />
                                Logout
                              </div>
                            </div>
                          </button>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          ) : (
            <Link href={DOC_ROUTES.AUTH.LOGIN} className="max-lg:hidden">
              <Button className="cursor-pointer" variant="outline">
                <span className="relative z-10">Login</span>
              </Button>
            </Link>
          )}
          <Link
            href={DOC_ROUTES.SOCIAL.GITHUB}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="size-4" />
            <span className="sr-only">GitHub</span>
          </Link>

          {/* Hamburger Menu Button (Mobile Only) */}
          <button
            className="text-muted-foreground relative flex size-8 lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            <div className="absolute top-1/2 left-1/2 block w-[18px] -translate-x-1/2 -translate-y-1/2">
              <span
                aria-hidden="true"
                className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-500 ease-in-out ${isMenuOpen ? "rotate-45" : "-translate-y-1.5"}`}
              ></span>
              <span
                aria-hidden="true"
                className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-500 ease-in-out ${isMenuOpen ? "opacity-0" : ""}`}
              ></span>
              <span
                aria-hidden="true"
                className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-500 ease-in-out ${isMenuOpen ? "-rotate-45" : "translate-y-1.5"}`}
              ></span>
            </div>
          </button>
        </div>
      </div>

      {/*  Mobile Menu Navigation */}
      <div
        className={cn(
          "bg-background fixed inset-x-0 top-[calc(100%+1rem)] flex flex-col rounded-2xl border p-6 transition-all duration-300 ease-in-out lg:hidden",
          isMenuOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-4 opacity-0",
        )}
      >
        <nav className="divide-border flex flex-1 flex-col divide-y">
          {ITEMS.map((link) =>
            link.dropdownItems ? (
              <div key={link.label} className="py-4 first:pt-0 last:pb-0">
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === link.label ? null : link.label,
                    )
                  }
                  className="text-primary flex w-full items-center justify-between text-base font-medium"
                >
                  {link.label}
                  <ChevronRight
                    className={cn(
                      "size-4 transition-transform duration-200",
                      openDropdown === link.label ? "rotate-90" : "",
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    openDropdown === link.label
                      ? "mt-4 max-h-[1000px] opacity-100"
                      : "max-h-0 opacity-0",
                  )}
                >
                  <div className="bg-muted/50 space-y-3 rounded-lg p-4">
                    {link.dropdownItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="group hover:bg-accent block rounded-md p-2 transition-colors"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setOpenDropdown(null);
                        }}
                      >
                        <div className="transition-transform duration-200 group-hover:translate-x-1">
                          <div className="text-primary font-medium">
                            {item.title}
                          </div>

                          <p className="text-muted-foreground mt-1 text-sm">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "text-primary hover:text-primary/80 py-4 text-base font-medium transition-colors first:pt-0 last:pb-0",
                  pathname === link.href && "text-muted-foreground",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        {/* Mobile Auth Buttons */}
        {!isAuthenticated && (
          <div className="pt-4 border-t">
            <Link href={DOC_ROUTES.AUTH.LOGIN}>
              <Button className="w-full cursor-pointer" variant="outline">
                <span className="relative z-10">Login</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
