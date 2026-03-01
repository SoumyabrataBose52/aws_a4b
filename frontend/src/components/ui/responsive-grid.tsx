"use client";

import React from "react";
import { useScreen, type Breakpoint } from "@/hooks/use-screen";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────── */
type ColSpec = Partial<Record<Breakpoint, number>>;

interface ResponsiveGridProps {
    children: React.ReactNode;
    /** Fixed column count OR per-breakpoint map, e.g. { xs: 1, sm: 2, lg: 3, xl: 4 } */
    columns?: number | ColSpec;
    /** Gap between items in px (default 16) */
    gap?: number;
    /** If true, auto-fills columns to use available space (CSS Grid auto-fill) */
    autoFill?: boolean;
    /** Min item width for auto-fill mode (default 280px) */
    minItemWidth?: number;
    /** Additional className */
    className?: string;
}

interface ResponsiveStackProps {
    children: React.ReactNode;
    /** Direction on mobile (default: vertical) */
    mobileDirection?: "vertical" | "horizontal";
    /** Direction on desktop (default: horizontal) */
    desktopDirection?: "vertical" | "horizontal";
    /** Gap in px */
    gap?: number;
    /** Make children fill available space equally */
    equalWidth?: boolean;
    className?: string;
}

interface AdaptiveContainerProps {
    children: React.ReactNode;
    /** Max width clamp (default none, fills available) */
    maxWidth?: number | string;
    /** Padding that scales with screen size */
    adaptivePadding?: boolean;
    className?: string;
}

/* ── Helpers ───────────────────────────────────────────────── */
const BREAKPOINT_ORDER: Breakpoint[] = ["xs", "sm", "md", "lg", "xl", "2xl"];

function resolveColumns(spec: ColSpec, current: Breakpoint): number {
    // Walk backwards from current breakpoint to find the nearest specified value
    const idx = BREAKPOINT_ORDER.indexOf(current);
    for (let i = idx; i >= 0; i--) {
        const val = spec[BREAKPOINT_ORDER[i]];
        if (val !== undefined) return val;
    }
    return 1;
}

/* ── ResponsiveGrid ────────────────────────────────────────── */
export function ResponsiveGrid({
    children,
    columns,
    gap = 16,
    autoFill = false,
    minItemWidth = 280,
    className,
}: ResponsiveGridProps) {
    const { breakpoint, columns: autoColumns } = useScreen();

    // Determine column count
    let cols: number;
    if (autoFill) {
        // Use CSS auto-fill — handled via inline style
        return (
            <div
                className={cn("w-full", className)}
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}px, 1fr))`,
                    gap: `${gap}px`,
                }}
            >
                {children}
            </div>
        );
    }

    if (columns === undefined) {
        cols = autoColumns;
    } else if (typeof columns === "number") {
        cols = columns;
    } else {
        cols = resolveColumns(columns, breakpoint);
    }

    return (
        <div
            className={cn("w-full", className)}
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: `${gap}px`,
            }}
        >
            {children}
        </div>
    );
}

/* ── ResponsiveStack ───────────────────────────────────────── */
export function ResponsiveStack({
    children,
    mobileDirection = "vertical",
    desktopDirection = "horizontal",
    gap = 16,
    equalWidth = false,
    className,
}: ResponsiveStackProps) {
    const { isMobile } = useScreen();

    const direction = isMobile ? mobileDirection : desktopDirection;
    const isRow = direction === "horizontal";

    return (
        <div
            className={cn("w-full", className)}
            style={{
                display: "flex",
                flexDirection: isRow ? "row" : "column",
                gap: `${gap}px`,
                flexWrap: isRow ? "wrap" : "nowrap",
            }}
        >
            {React.Children.map(children, (child) =>
                equalWidth && React.isValidElement(child)
                    ? React.cloneElement(child as React.ReactElement<any>, {
                        style: {
                            ...(child.props as any).style,
                            flex: isRow ? "1 1 0%" : undefined,
                            minWidth: isRow ? 0 : undefined,
                        },
                    })
                    : child
            )}
        </div>
    );
}

/* ── AdaptiveContainer ─────────────────────────────────────── */
export function AdaptiveContainer({
    children,
    maxWidth,
    adaptivePadding = true,
    className,
}: AdaptiveContainerProps) {
    const { isMobile, isTablet } = useScreen();

    const padding = adaptivePadding
        ? isMobile ? "16px" : isTablet ? "24px" : "32px"
        : undefined;

    return (
        <div
            className={cn("w-full mx-auto", className)}
            style={{
                maxWidth: maxWidth
                    ? typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth
                    : undefined,
                padding,
            }}
        >
            {children}
        </div>
    );
}
