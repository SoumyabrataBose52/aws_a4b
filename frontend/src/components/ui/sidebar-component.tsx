"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Search,
    LayoutDashboard,
    Users,
    FileText,
    TrendingUp,
    Flag,
    Handshake,
    BarChart3,
    Settings,
    User,
    ChevronDown,
    Plus,
    Filter,
    Clock,
    Loader,
    CheckCircle,
    Archive,
    Eye,
    FileBarChart,
    Star,
    FolderOpen,
    Share2,
    CloudUpload,
    Shield,
    Bell,
    Plug,
    MoreHorizontal,
    Sparkles,
} from "lucide-react";

// Softer spring animation curve
const softSpringEasing = "cubic-bezier(0.25, 1.1, 0.4, 1)";

/* ----------------------------- Brand / Logo ----------------------------- */

function NexusLogo() {
    return (
        <div className="size-7 flex items-center justify-center">
            <svg className="size-6" viewBox="0 0 24 16" fill="none">
                <path
                    d="M0.32 0C0.208 0 0.152 0 0.109 0.022C0.072 0.041 0.041 0.072 0.022 0.109C0 0.152 0 0.208 0 0.32V6.68C0 6.792 0 6.848 0.022 6.891C0.041 6.928 0.072 6.959 0.109 6.978C0.152 7 0.208 7 0.32 7L3.68 7C3.792 7 3.848 7 3.891 6.978C3.928 6.959 3.959 6.928 3.978 6.891C4 6.848 4 6.792 4 6.68V4.32C4 4.208 4 4.152 4.022 4.109C4.041 4.072 4.072 4.041 4.109 4.022C4.152 4 4.208 4 4.32 4L19.68 4C19.792 4 19.848 4 19.891 4.022C19.928 4.041 19.959 4.072 19.978 4.109C20 4.152 20 4.208 20 4.32V6.68C20 6.792 20 6.848 20.022 6.891C20.041 6.928 20.072 6.959 20.109 6.978C20.152 7 20.208 7 20.32 7L23.68 7C23.792 7 23.848 7 23.891 6.978C23.928 6.959 23.959 6.928 23.978 6.891C24 6.848 24 6.792 24 6.68V0.32C24 0.208 24 0.152 23.978 0.109C23.959 0.072 23.928 0.041 23.891 0.022C23.848 0 23.792 0 23.68 0H0.32Z"
                    fill="#FAFAFA"
                />
                <path
                    d="M0.32 16C0.208 16 0.152 16 0.109 15.978C0.072 15.959 0.041 15.928 0.022 15.891C0 15.848 0 15.792 0 15.68V9.32C0 9.208 0 9.152 0.022 9.109C0.041 9.072 0.072 9.041 0.109 9.022C0.152 9 0.208 9 0.32 9H3.68C3.792 9 3.848 9 3.891 9.022C3.928 9.041 3.959 9.072 3.978 9.109C4 9.152 4 9.208 4 9.32V11.68C4 11.792 4 11.848 4.022 11.891C4.041 11.928 4.072 11.959 4.109 11.978C4.152 12 4.208 12 4.32 12L19.68 12C19.792 12 19.848 12 19.891 11.978C19.928 11.959 19.959 11.928 19.978 11.891C20 11.848 20 11.792 20 11.68V9.32C20 9.208 20 9.152 20.022 9.109C20.041 9.072 20.072 9.041 20.109 9.022C20.152 9 20.208 9 20.32 9H23.68C23.792 9 23.848 9 23.891 9.022C23.928 9.041 23.959 9.072 23.978 9.109C24 9.152 24 9.208 24 9.32V15.68C24 15.792 24 15.848 23.978 15.891C23.959 15.928 23.928 15.959 23.891 15.978C23.848 16 23.792 16 23.68 16H0.32Z"
                    fill="#FAFAFA"
                />
                <path
                    d="M6.32 10C6.208 10 6.152 10 6.109 9.978C6.072 9.959 6.041 9.928 6.022 9.891C6 9.848 6 9.792 6 9.68V6.32C6 6.208 6 6.152 6.022 6.109C6.041 6.072 6.072 6.041 6.109 6.022C6.152 6 6.208 6 6.32 6L17.68 6C17.792 6 17.848 6 17.891 6.022C17.928 6.041 17.959 6.072 17.978 6.109C18 6.152 18 6.208 18 6.32V9.68C18 9.792 18 9.848 17.978 9.891C17.959 9.928 17.928 9.959 17.891 9.978C17.848 10 17.792 10 17.68 10H6.32Z"
                    fill="#FAFAFA"
                />
            </svg>
        </div>
    );
}

function BrandBadge() {
    return (
        <div className="relative shrink-0 w-full">
            <div className="flex items-center gap-2 px-3 py-2 w-full">
                <NexusLogo />
                <div className="font-semibold text-base text-neutral-50">
                    Nexus Solo
                </div>
            </div>
        </div>
    );
}

/* --------------------------------- Avatar -------------------------------- */

function AvatarCircle() {
    return (
        <div className="relative rounded-full shrink-0 size-8 bg-gradient-to-br from-accent to-[#a29bfe]">
            <div className="flex items-center justify-center size-8">
                <User size={14} className="text-white" />
            </div>
        </div>
    );
}

/* ------------------------------ Search Input ----------------------------- */

function SearchContainer({ isCollapsed = false }: { isCollapsed?: boolean }) {
    const [searchValue, setSearchValue] = useState("");

    return (
        <div
            className={`relative shrink-0 transition-all duration-500 ${isCollapsed ? "w-full flex justify-center" : "w-full"
                }`}
            style={{ transitionTimingFunction: softSpringEasing }}
        >
            <div
                className={`bg-bg-secondary h-10 relative rounded-lg flex items-center transition-all duration-500 border border-border ${isCollapsed ? "w-10 min-w-10 justify-center" : "w-full"
                    }`}
                style={{ transitionTimingFunction: softSpringEasing }}
            >
                <div
                    className={`flex items-center justify-center shrink-0 transition-all duration-500 ${isCollapsed ? "p-1" : "px-2"
                        }`}
                    style={{ transitionTimingFunction: softSpringEasing }}
                >
                    <Search size={14} className="text-text-secondary" />
                </div>

                <div
                    className={`flex-1 relative transition-opacity duration-500 overflow-hidden ${isCollapsed ? "opacity-0 w-0" : "opacity-100"
                        }`}
                    style={{ transitionTimingFunction: softSpringEasing }}
                >
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-secondary leading-5"
                        tabIndex={isCollapsed ? -1 : 0}
                    />
                </div>
            </div>
        </div>
    );
}

/* --------------------------- Types / Content Map -------------------------- */

interface MenuItemT {
    icon?: React.ReactNode;
    label: string;
    href?: string;
    hasDropdown?: boolean;
    isActive?: boolean;
    children?: MenuItemT[];
}
interface MenuSectionT {
    title: string;
    items: MenuItemT[];
}
interface SidebarContent {
    title: string;
    sections: MenuSectionT[];
}

function getSidebarContent(activeSection: string): SidebarContent {
    const contentMap: Record<string, SidebarContent> = {
        dashboard: {
            title: "Command Center",
            sections: [
                {
                    title: "Overview",
                    items: [
                        { icon: <Eye size={16} className="text-text-primary" />, label: "Dashboard", href: "/dashboard" },
                        { icon: <BarChart3 size={16} className="text-text-primary" />, label: "Analytics", href: "/dashboard/analytics" },
                    ],
                },
                {
                    title: "Creator Management",
                    items: [
                        {
                            icon: <Users size={16} className="text-text-primary" />,
                            label: "Creators",
                            href: "/dashboard/creators",
                            hasDropdown: true,
                            children: [
                                { label: "Active Creators", href: "/dashboard/creators" },
                                { label: "Onboarding", href: "/dashboard/creators" },
                                { label: "Creator DNA Profiles", href: "/dashboard/creators" },
                            ],
                        },
                        {
                            icon: <FileText size={16} className="text-text-primary" />,
                            label: "Content",
                            href: "/dashboard/content",
                            hasDropdown: true,
                            children: [
                                { label: "All Content", href: "/dashboard/content" },
                                { label: "AI Generated", href: "/dashboard/content" },
                                { label: "Scheduled Posts", href: "/dashboard/content" },
                            ],
                        },
                    ],
                },
                {
                    title: "Intelligence",
                    items: [
                        { icon: <TrendingUp size={16} className="text-text-primary" />, label: "Trends", href: "/dashboard/trends" },
                        {
                            icon: <Shield size={16} className="text-text-primary" />,
                            label: "Crisis Monitor",
                            href: "/dashboard/crisis",
                            hasDropdown: true,
                            children: [
                                { label: "Active Crises", href: "/dashboard/crisis" },
                                { label: "Response Strategies", href: "/dashboard/crisis" },
                                { label: "Sentiment Tracking", href: "/dashboard/crisis" },
                            ],
                        },
                    ],
                },
                {
                    title: "Business",
                    items: [
                        {
                            icon: <Handshake size={16} className="text-text-primary" />,
                            label: "Deals",
                            href: "/dashboard/deals",
                            hasDropdown: true,
                            children: [
                                { label: "Active Deals", href: "/dashboard/deals" },
                                { label: "Prospecting", href: "/dashboard/deals" },
                                { label: "Completed", href: "/dashboard/deals" },
                            ],
                        },
                    ],
                },
            ],
        },

        creators: {
            title: "Creators",
            sections: [
                {
                    title: "Quick Actions",
                    items: [
                        { icon: <Plus size={16} className="text-text-primary" />, label: "Add Creator", href: "/dashboard/creators" },
                        { icon: <Filter size={16} className="text-text-primary" />, label: "Filter Creators" },
                    ],
                },
                {
                    title: "By Status",
                    items: [
                        { icon: <CheckCircle size={16} className="text-text-primary" />, label: "Active", href: "/dashboard/creators" },
                        { icon: <Loader size={16} className="text-text-primary" />, label: "Onboarding", href: "/dashboard/creators" },
                        { icon: <Archive size={16} className="text-text-primary" />, label: "Inactive", href: "/dashboard/creators" },
                    ],
                },
                {
                    title: "Tools",
                    items: [
                        { icon: <Star size={16} className="text-text-primary" />, label: "Creator DNA", href: "/dashboard/creators" },
                        { icon: <FileBarChart size={16} className="text-text-primary" />, label: "Media Kits", href: "/dashboard/creators" },
                    ],
                },
            ],
        },

        content: {
            title: "Content",
            sections: [
                {
                    title: "Quick Actions",
                    items: [
                        { icon: <Sparkles size={16} className="text-text-primary" />, label: "Generate Content", href: "/dashboard/content" },
                        { icon: <Filter size={16} className="text-text-primary" />, label: "Filter Content" },
                    ],
                },
                {
                    title: "By Status",
                    items: [
                        { icon: <Clock size={16} className="text-text-primary" />, label: "Drafts", href: "/dashboard/content" },
                        { icon: <Clock size={16} className="text-text-primary" />, label: "Scheduled", href: "/dashboard/content" },
                        { icon: <CheckCircle size={16} className="text-text-primary" />, label: "Published", href: "/dashboard/content" },
                    ],
                },
                {
                    title: "AI Generation",
                    items: [
                        { icon: <Star size={16} className="text-text-primary" />, label: "AI Generated", href: "/dashboard/content" },
                        { icon: <BarChart3 size={16} className="text-text-primary" />, label: "Performance", href: "/dashboard/content" },
                    ],
                },
            ],
        },

        trends: {
            title: "Trends",
            sections: [
                {
                    title: "Status",
                    items: [
                        { icon: <Loader size={16} className="text-text-primary" />, label: "Active Trends", href: "/dashboard/trends" },
                        { icon: <Flag size={16} className="text-text-primary" />, label: "Critical", href: "/dashboard/trends" },
                        { icon: <Archive size={16} className="text-text-primary" />, label: "Expired", href: "/dashboard/trends" },
                    ],
                },
                {
                    title: "Actions",
                    items: [
                        { icon: <Plus size={16} className="text-text-primary" />, label: "Track New Trend", href: "/dashboard/trends" },
                        { icon: <Users size={16} className="text-text-primary" />, label: "Match Creators", href: "/dashboard/trends" },
                    ],
                },
            ],
        },

        crisis: {
            title: "Crisis Monitor",
            sections: [
                {
                    title: "Active Monitoring",
                    items: [
                        { icon: <Flag size={16} className="text-danger" />, label: "Critical Alerts", href: "/dashboard/crisis" },
                        { icon: <Loader size={16} className="text-text-primary" />, label: "Active Crises", href: "/dashboard/crisis" },
                        { icon: <Eye size={16} className="text-text-primary" />, label: "Monitoring", href: "/dashboard/crisis" },
                    ],
                },
                {
                    title: "Response",
                    items: [
                        { icon: <FileText size={16} className="text-text-primary" />, label: "Strategies", href: "/dashboard/crisis" },
                        { icon: <CheckCircle size={16} className="text-text-primary" />, label: "Resolved", href: "/dashboard/crisis" },
                    ],
                },
            ],
        },

        deals: {
            title: "Deals",
            sections: [
                {
                    title: "Quick Actions",
                    items: [
                        { icon: <Plus size={16} className="text-text-primary" />, label: "New Deal", href: "/dashboard/deals" },
                        { icon: <Filter size={16} className="text-text-primary" />, label: "Filter Deals" },
                    ],
                },
                {
                    title: "Pipeline",
                    items: [
                        { icon: <FolderOpen size={16} className="text-text-primary" />, label: "Prospecting", href: "/dashboard/deals" },
                        { icon: <Loader size={16} className="text-text-primary" />, label: "Negotiating", href: "/dashboard/deals" },
                        { icon: <CheckCircle size={16} className="text-text-primary" />, label: "Accepted", href: "/dashboard/deals" },
                        { icon: <Archive size={16} className="text-text-primary" />, label: "Completed", href: "/dashboard/deals" },
                    ],
                },
            ],
        },

        analytics: {
            title: "Analytics",
            sections: [
                {
                    title: "Reports",
                    items: [
                        { icon: <FileBarChart size={16} className="text-text-primary" />, label: "Performance", href: "/dashboard/analytics" },
                        { icon: <BarChart3 size={16} className="text-text-primary" />, label: "Engagement", href: "/dashboard/analytics" },
                        { icon: <TrendingUp size={16} className="text-text-primary" />, label: "Predictions", href: "/dashboard/analytics" },
                    ],
                },
                {
                    title: "Insights",
                    items: [
                        { icon: <Clock size={16} className="text-text-primary" />, label: "Optimal Posting Times", href: "/dashboard/analytics" },
                        { icon: <Star size={16} className="text-text-primary" />, label: "Growth Forecast", href: "/dashboard/analytics" },
                    ],
                },
            ],
        },

        settings: {
            title: "Settings",
            sections: [
                {
                    title: "Account",
                    items: [
                        { icon: <User size={16} className="text-text-primary" />, label: "Profile" },
                        { icon: <Shield size={16} className="text-text-primary" />, label: "API Keys" },
                        { icon: <Bell size={16} className="text-text-primary" />, label: "Notifications" },
                    ],
                },
                {
                    title: "System",
                    items: [
                        { icon: <Settings size={16} className="text-text-primary" />, label: "LLM Provider" },
                        { icon: <Plug size={16} className="text-text-primary" />, label: "Integrations" },
                    ],
                },
            ],
        },
    };

    return contentMap[activeSection] || contentMap.dashboard;
}

/* ---- Map pathname to active section ---- */
function getActiveSectionFromPath(pathname: string): string {
    if (pathname.startsWith("/dashboard/creators")) return "creators";
    if (pathname.startsWith("/dashboard/content")) return "content";
    if (pathname.startsWith("/dashboard/trends")) return "trends";
    if (pathname.startsWith("/dashboard/crisis")) return "crisis";
    if (pathname.startsWith("/dashboard/deals")) return "deals";
    if (pathname.startsWith("/dashboard/analytics")) return "analytics";
    return "dashboard";
}

/* ---------------------------- Left Icon Nav Rail -------------------------- */

function IconNavButton({
    children,
    isActive = false,
    onClick,
    href,
    label,
}: {
    children: React.ReactNode;
    isActive?: boolean;
    onClick?: () => void;
    href?: string;
    label?: string;
}) {
    const className = `flex items-center justify-center rounded-lg size-10 min-w-10 transition-all duration-300
    ${isActive ? "bg-bg-card text-accent shadow-[0_0_12px_rgba(108,92,231,0.2)]" : "hover:bg-bg-card text-text-secondary hover:text-text-primary"}`;

    if (href) {
        return (
            <Link href={href} className={className} onClick={onClick} title={label}>
                {children}
            </Link>
        );
    }

    return (
        <button type="button" className={className} onClick={onClick} title={label}>
            {children}
        </button>
    );
}

function IconNavigation({
    activeSection,
    onSectionChange,
}: {
    activeSection: string;
    onSectionChange: (section: string) => void;
}) {
    const navItems = [
        { id: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard", href: "/dashboard" },
        { id: "creators", icon: <Users size={18} />, label: "Creators", href: "/dashboard/creators" },
        { id: "content", icon: <FileText size={18} />, label: "Content", href: "/dashboard/content" },
        { id: "trends", icon: <TrendingUp size={18} />, label: "Trends", href: "/dashboard/trends" },
        { id: "crisis", icon: <Shield size={18} />, label: "Crisis", href: "/dashboard/crisis" },
        { id: "deals", icon: <Handshake size={18} />, label: "Deals", href: "/dashboard/deals" },
        { id: "analytics", icon: <BarChart3 size={18} />, label: "Analytics", href: "/dashboard/analytics" },
    ];

    return (
        <aside className="bg-bg-primary flex flex-col gap-1.5 items-center py-4 px-2 w-[60px] shrink-0 h-screen sticky top-0 border-r border-border overflow-y-auto">
            {/* Logo */}
            <Link href="/" className="mb-3 size-10 flex items-center justify-center rounded-lg hover:bg-bg-card transition-colors">
                <NexusLogo />
            </Link>

            {/* Navigation Icons */}
            <div className="flex flex-col gap-1.5 w-full items-center">
                {navItems.map((item) => (
                    <IconNavButton
                        key={item.id}
                        isActive={activeSection === item.id}
                        href={item.href}
                        label={item.label}
                        onClick={() => onSectionChange(item.id)}
                    >
                        {item.icon}
                    </IconNavButton>
                ))}
            </div>

            <div className="flex-1" />

            {/* Bottom section */}
            <div className="flex flex-col gap-1.5 w-full items-center">
                <IconNavButton
                    isActive={activeSection === "settings"}
                    onClick={() => onSectionChange("settings")}
                    label="Settings"
                >
                    <Settings size={18} />
                </IconNavButton>
                <AvatarCircle />
            </div>
        </aside>
    );
}

/* ------------------------------ Detail Sidebar ----------------------------- */

function SectionTitle({
    title,
    onToggleCollapse,
    isCollapsed,
}: {
    title: string;
    onToggleCollapse: () => void;
    isCollapsed: boolean;
}) {
    if (isCollapsed) {
        return (
            <div className="w-full flex justify-center">
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="flex items-center justify-center rounded-lg size-10 hover:bg-bg-card text-text-secondary hover:text-text-primary transition-colors"
                    aria-label="Expand sidebar"
                >
                    <ChevronDown size={16} className="rotate-[-90deg]" />
                </button>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden transition-all duration-500" style={{ transitionTimingFunction: softSpringEasing }}>
            <div className="flex items-center justify-between">
                <div className="flex items-center h-10 px-1">
                    <div className="font-semibold text-lg text-text-primary">
                        {title}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="flex items-center justify-center rounded-lg size-8 hover:bg-bg-card text-text-secondary hover:text-text-primary transition-colors"
                    aria-label="Collapse sidebar"
                >
                    <ChevronDown size={14} className="-rotate-90" />
                </button>
            </div>
        </div>
    );
}

function DetailSidebar({ activeSection, isCollapsed, onToggleCollapse, pathname }: { activeSection: string; isCollapsed: boolean; onToggleCollapse: () => void; pathname: string }) {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const content = getSidebarContent(activeSection);

    const toggleExpanded = (itemKey: string) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            if (next.has(itemKey)) next.delete(itemKey);
            else next.add(itemKey);
            return next;
        });
    };

    return (
        <aside
            className={`bg-bg-primary flex flex-col gap-3 items-start p-3 transition-all duration-500 h-screen sticky top-0 border-r border-border overflow-y-auto ${isCollapsed ? "w-[52px] min-w-[52px] !px-1.5 items-center" : "w-[260px] shrink-0"
                }`}
            style={{ transitionTimingFunction: softSpringEasing }}
        >
            {!isCollapsed && <BrandBadge />}

            <SectionTitle title={content.title} onToggleCollapse={onToggleCollapse} isCollapsed={isCollapsed} />
            <SearchContainer isCollapsed={isCollapsed} />

            <div
                className={`flex flex-col w-full overflow-y-auto flex-1 ${isCollapsed ? "gap-1.5 items-center" : "gap-3"
                    }`}
            >
                {content.sections.map((section, index) => (
                    <MenuSection
                        key={`${activeSection}-${index}`}
                        section={section}
                        expandedItems={expandedItems}
                        onToggleExpanded={toggleExpanded}
                        isCollapsed={isCollapsed}
                        pathname={pathname}
                    />
                ))}
            </div>

            {!isCollapsed && (
                <div className="w-full mt-auto pt-2 border-t border-border">
                    <div className="flex items-center gap-2.5 px-2 py-2">
                        <AvatarCircle />
                        <div className="text-sm text-text-primary font-medium">Admin</div>
                        <button
                            type="button"
                            className="ml-auto size-7 rounded-md flex items-center justify-center hover:bg-bg-card text-text-secondary hover:text-text-primary transition-colors"
                            aria-label="More options"
                        >
                            <MoreHorizontal size={14} />
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
}

/* ------------------------------ Menu Elements ---------------------------- */

function MenuItem({
    item,
    isExpanded,
    onToggle,
    isCollapsed,
    isActive,
}: {
    item: MenuItemT;
    isExpanded?: boolean;
    onToggle?: () => void;
    isCollapsed?: boolean;
    isActive?: boolean;
}) {
    const handleClick = () => {
        if (item.hasDropdown && onToggle) onToggle();
    };

    const inner = (
        <>
            <div className={`flex items-center justify-center shrink-0 ${isActive ? "[&>svg]:text-accent" : ""}`}>{item.icon}</div>
            <div
                className={`flex-1 relative transition-opacity duration-500 overflow-hidden ${isCollapsed ? "opacity-0 w-0" : "opacity-100 ml-2.5"
                    }`}
                style={{ transitionTimingFunction: softSpringEasing }}
            >
                <div className={`text-sm leading-5 truncate ${isActive ? "text-accent font-semibold" : "text-text-primary"}`}>
                    {item.label}
                </div>
            </div>
            {item.hasDropdown && !isCollapsed && (
                <ChevronDown
                    size={14}
                    className={`text-text-secondary transition-transform duration-300 shrink-0 ml-1 ${isExpanded ? "rotate-180" : ""}`}
                />
            )}
        </>
    );

    const baseClasses = `rounded-lg cursor-pointer transition-all duration-200 flex items-center relative ${isActive
        ? "bg-accent/10 border-l-2 border-accent"
        : "hover:bg-bg-card border-l-2 border-transparent"
        } ${isCollapsed ? "w-10 min-w-10 h-9 justify-center !border-l-0" : "w-full h-9 px-3 py-1.5"}`;

    if (item.href && !item.hasDropdown) {
        return (
            <div className={`relative shrink-0 ${isCollapsed ? "w-full flex justify-center" : "w-full"}`}>
                <Link href={item.href} className={baseClasses} title={isCollapsed ? item.label : undefined}>
                    {inner}
                </Link>
            </div>
        );
    }

    return (
        <div className={`relative shrink-0 ${isCollapsed ? "w-full flex justify-center" : "w-full"}`}>
            <div className={baseClasses} onClick={handleClick} title={isCollapsed ? item.label : undefined}>
                {inner}
            </div>
        </div>
    );
}

function SubMenuItem({ item }: { item: MenuItemT }) {
    const content = (
        <div className="text-sm text-text-secondary leading-[18px] truncate">
            {item.label}
        </div>
    );

    const cls = "h-8 w-full rounded-md cursor-pointer transition-colors hover:bg-bg-card flex items-center px-3";

    return (
        <div className="w-full pl-8 pr-1 py-px">
            {item.href ? (
                <Link href={item.href} className={cls}>{content}</Link>
            ) : (
                <div className={cls}>{content}</div>
            )}
        </div>
    );
}

function MenuSection({
    section,
    expandedItems,
    onToggleExpanded,
    isCollapsed,
    pathname,
}: {
    section: MenuSectionT;
    expandedItems: Set<string>;
    onToggleExpanded: (itemKey: string) => void;
    isCollapsed?: boolean;
    pathname?: string;
}) {
    return (
        <div className="flex flex-col w-full">
            {!isCollapsed && (
                <div className="h-8 flex items-center px-3">
                    <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                        {section.title}
                    </div>
                </div>
            )}

            {section.items.map((item, index) => {
                const itemKey = `${section.title}-${index}`;
                const isExpanded = expandedItems.has(itemKey);
                // Check if this item's href matches the current pathname
                const isItemActive = !!(item.href && pathname && (
                    item.href === pathname ||
                    (item.href === "/dashboard" && pathname === "/dashboard") ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href))
                ));
                return (
                    <div key={itemKey} className="w-full flex flex-col">
                        <MenuItem
                            item={item}
                            isExpanded={isExpanded}
                            onToggle={() => onToggleExpanded(itemKey)}
                            isCollapsed={isCollapsed}
                            isActive={isItemActive}
                        />
                        {isExpanded && item.children && !isCollapsed && (
                            <div className="flex flex-col gap-0.5 mb-1.5">
                                {item.children.map((child, childIndex) => (
                                    <SubMenuItem key={`${itemKey}-${childIndex}`} item={child} />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* --------------------------------- Layout -------------------------------- */

export function NexusSidebar() {
    const pathname = usePathname();
    const [activeSection, setActiveSection] = useState(() => getActiveSectionFromPath(pathname));
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Sync sidebar state with URL when navigating via links in main content
    useEffect(() => {
        setActiveSection(getActiveSectionFromPath(pathname));
    }, [pathname]);

    // Auto-expand detail panel when a section icon is clicked
    const handleSectionChange = (section: string) => {
        setActiveSection(section);
        setIsCollapsed(false); // always expand on icon click
    };

    return (
        <div className="flex flex-row">
            <IconNavigation activeSection={activeSection} onSectionChange={handleSectionChange} />
            <DetailSidebar activeSection={activeSection} isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(s => !s)} pathname={pathname} />
        </div>
    );
}

export default NexusSidebar;
