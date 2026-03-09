"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Search, Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
                <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 px-4 md:px-6 glass-panel rounded-none border-t-0 border-l-0 border-r-0 sticky top-0 z-30 transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors scale-110 md:scale-100" />
                        <Separator orientation="vertical" className="h-5 mx-1 hidden sm:block" />
                        <nav className="hidden sm:flex items-center gap-1.5 text-sm">
                            {breadcrumbs.map((crumb, i) => (
                                <span key={i} className="flex items-center gap-1.5">
                                    {i > 0 && <span className="text-muted-foreground/40 mx-0.5">/</span>}
                                    <span className={crumb.isLast ? "text-foreground font-semibold tracking-tight" : "text-muted-foreground hover:text-foreground transition-colors"}>
                                        {crumb.label}
                                    </span>
                                </span>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-secondary/30 backdrop-blur-md border border-border/60 rounded-full hover:bg-secondary/60 hover:text-foreground transition-all shadow-sm">
                            <Search size={14} className="opacity-70" />
                            <span className="hidden md:inline font-medium">Search...</span>
                            <kbd className="hidden md:inline-flex h-5 items-center gap-0.5 rounded-full border border-border/50 bg-background/50 px-2 font-mono text-[10px] text-muted-foreground shadow-sm">
                                ⌘K
                            </kbd>
                        </button>
                        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/60 backdrop-blur-md">
                            <Bell size={18} className="opacity-80" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-brand rounded-full border-2 border-background animate-pulse-soft"></span>
                        </button>
                        <Separator orientation="vertical" className="h-5 mx-1 hidden md:block" />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-brand to-accent-violet flex items-center justify-center text-[11px] font-bold text-white shadow-md shadow-accent-brand/20 ring-2 ring-background border border-white/10 cursor-pointer hover:scale-105 transition-transform">
                            A
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 bg-gradient-to-b from-transparent to-background/50">
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="h-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
