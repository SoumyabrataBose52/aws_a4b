"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Search, Bell } from "lucide-react";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboard = pathname.startsWith("/dashboard");

    if (!isDashboard) {
        return <>{children}</>;
    }

    // Build breadcrumb from path
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = segments.map((seg, i) => ({
        label: seg.charAt(0).toUpperCase() + seg.slice(1),
        isLast: i === segments.length - 1,
    }));

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
                        <Separator orientation="vertical" className="h-4 mx-1" />
                        <nav className="flex items-center gap-1 text-sm">
                            {breadcrumbs.map((crumb, i) => (
                                <span key={i} className="flex items-center gap-1">
                                    {i > 0 && <span className="text-muted-foreground/50 mx-0.5">/</span>}
                                    <span className={crumb.isLast ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground transition-colors"}>
                                        {crumb.label}
                                    </span>
                                </span>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-secondary/50 border border-border rounded-md hover:bg-secondary hover:text-foreground transition-all">
                            <Search size={12} />
                            <span className="hidden md:inline">Search...</span>
                            <kbd className="hidden md:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground">
                                ⌘K
                            </kbd>
                        </button>
                        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary">
                            <Bell size={16} />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent-brand rounded-full"></span>
                        </button>
                        <Separator orientation="vertical" className="h-4 mx-1 hidden md:block" />
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-brand to-accent-violet flex items-center justify-center text-[10px] font-bold text-white">
                            A
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
