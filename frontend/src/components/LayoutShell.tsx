"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboard = pathname.startsWith("/dashboard");

    if (!isDashboard) {
        return <>{children}</>;
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
                    <SidebarTrigger className="-ml-1 text-muted-foreground" />
                    <div className="h-4 w-px bg-sidebar-border" />
                    <span className="text-sm text-muted-foreground truncate">
                        {pathname === "/dashboard" ? "Command Center" : pathname.split("/").pop()?.replace(/^\w/, c => c.toUpperCase())}
                    </span>
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
