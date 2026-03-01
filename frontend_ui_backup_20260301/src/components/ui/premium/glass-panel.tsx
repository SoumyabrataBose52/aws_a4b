"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
    gradient?: boolean;
    hoverEffect?: boolean;
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
    ({ className, gradient = false, hoverEffect = true, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "relative overflow-hidden rounded-[16px] border border-white/5 bg-white/[0.02] backdrop-blur-xl",
                    "shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]",
                    hoverEffect && "transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04] hover:shadow-[0_8px_32px_-4px_rgba(108,92,231,0.15)]",
                    className
                )}
                {...props}
            >
                {gradient && (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6c5ce7]/10 to-transparent opacity-50 pointer-events-none" />
                )}
                <div className="relative z-10 w-full h-full">
                    {children}
                </div>
            </div>
        );
    }
);
GlassPanel.displayName = "GlassPanel";
