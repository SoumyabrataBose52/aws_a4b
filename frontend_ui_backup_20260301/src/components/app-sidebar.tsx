"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    FileText,
    TrendingUp,
    Shield,
    Handshake,
    BarChart3,
    Settings,
    ChevronDown,
    User2,
    Zap,
} from "lucide-react";

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
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from "@/components/ui/sidebar";

/* ── Navigation data ──────────────────────────────────────── */

const navMain = [
    {
        group: "Overview",
        items: [
            { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
            { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
        ],
    },
    {
        group: "Creator Management",
        items: [
            {
                title: "Creators",
                url: "/dashboard/creators",
                icon: Users,
                subs: [
                    { title: "Active", url: "/dashboard/creators" },
                    { title: "Onboarding", url: "/dashboard/creators" },
                    { title: "Inactive", url: "/dashboard/creators" },
                ],
            },
            {
                title: "Content",
                url: "/dashboard/content",
                icon: FileText,
                subs: [
                    { title: "Drafts", url: "/dashboard/content" },
                    { title: "Published", url: "/dashboard/content" },
                    { title: "Scheduled", url: "/dashboard/content" },
                ],
            },
        ],
    },
    {
        group: "Intelligence",
        items: [
            { title: "Trends", url: "/dashboard/trends", icon: TrendingUp },
            {
                title: "Crisis Monitor",
                url: "/dashboard/crisis",
                icon: Shield,
                subs: [
                    { title: "Active Alerts", url: "/dashboard/crisis" },
                    { title: "History", url: "/dashboard/crisis" },
                ],
            },
        ],
    },
    {
        group: "Business",
        items: [
            {
                title: "Deals",
                url: "/dashboard/deals",
                icon: Handshake,
                subs: [
                    { title: "Pipeline", url: "/dashboard/deals" },
                    { title: "Closed", url: "/dashboard/deals" },
                ],
            },
        ],
    },
];

/* ── AppSidebar component ─────────────────────────────────── */

export function AppSidebar() {
    const pathname = usePathname();

    const isActive = (url: string) => {
        if (url === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(url);
    };

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            {/* Header */}
            <SidebarHeader className="pt-4 px-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="group-data-[collapsible=icon]:!p-0 mb-2"
                        >
                            <Link href="/dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] text-white">
                                    <Zap className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                                    <span className="truncate font-bold text-[15px]">Nexus Solo</span>
                                    <span className="truncate text-xs text-muted-foreground font-medium">
                                        AI Command Center
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Content */}
            <SidebarContent className="px-2">
                {navMain.map((section) => (
                    <SidebarGroup key={section.group}>
                        <SidebarGroupLabel>{section.group}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {section.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive(item.url)}
                                            tooltip={item.title}
                                        >
                                            <Link href={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>

                                        {item.subs && (
                                            <SidebarMenuSub>
                                                {item.subs.map((sub) => (
                                                    <SidebarMenuSubItem key={sub.title}>
                                                        <SidebarMenuSubButton asChild>
                                                            <Link href={sub.url}>
                                                                <span>{sub.title}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        )}
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter className="pb-4 px-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Settings">
                            <Link href="/dashboard">
                                <Settings />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton>
                            <User2 />
                            <span>Admin</span>
                            <ChevronDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
