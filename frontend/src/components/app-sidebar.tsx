"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// Navigation data — sidebar-03 style (flat groups with sub-items)
const data = {
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      items: [
        { title: "Dashboard", url: "/dashboard" },
        { title: "Analytics", url: "/dashboard/analytics" },
      ],
    },
    {
      title: "Workspace",
      url: "#",
      items: [
        { title: "Creators", url: "/dashboard/creators" },
        { title: "Content Engine", url: "/dashboard/content" },
        { title: "Deal Pipeline", url: "/dashboard/deals" },
      ],
    },
    {
      title: "Intelligence",
      url: "#",
      items: [
        { title: "Trends", url: "/dashboard/trends" },
        { title: "Crisis Monitor", url: "/dashboard/crisis" },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const isActive = (url: string) => {
    if (url === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(url);
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="relative overflow-hidden bg-gradient-to-br from-accent-brand/50 to-accent-violet/50 backdrop-blur-xl text-white flex aspect-square size-8 items-center justify-center rounded-lg shadow-lg border border-white/20 ring-1 ring-inset ring-white/10">
                  <div className="absolute inset-0 bg-gradient-to-t from-white/10 flex to-transparent pointer-events-none" />
                  <Zap className="size-4 relative z-10" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold tracking-wide">Nexus Solo</span>
                  <span className="text-xs text-muted-foreground">AI Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url} className="font-medium">
                    {item.title}
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild isActive={isActive(subItem.url)}>
                          <Link href={subItem.url}>{subItem.title}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
