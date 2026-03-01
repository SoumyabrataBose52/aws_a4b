"use client";

import { useState, useEffect, useCallback } from "react";

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const BREAKPOINTS = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
} as const;

interface ScreenInfo {
    /** Current viewport width in pixels */
    width: number;
    /** Current viewport height in pixels */
    height: number;
    /** Named breakpoint (xs, sm, md, lg, xl, 2xl) */
    breakpoint: Breakpoint;
    /** True when viewport < 768px */
    isMobile: boolean;
    /** True when viewport >= 768px && < 1024px */
    isTablet: boolean;
    /** True when viewport >= 1024px */
    isDesktop: boolean;
    /** True when viewport >= 1280px */
    isWide: boolean;
    /** Optimal column count for grid layouts */
    columns: number;
}

function getBreakpoint(width: number): Breakpoint {
    if (width >= BREAKPOINTS["2xl"]) return "2xl";
    if (width >= BREAKPOINTS.xl) return "xl";
    if (width >= BREAKPOINTS.lg) return "lg";
    if (width >= BREAKPOINTS.md) return "md";
    if (width >= BREAKPOINTS.sm) return "sm";
    return "xs";
}

function getColumns(width: number): number {
    if (width >= BREAKPOINTS["2xl"]) return 4;
    if (width >= BREAKPOINTS.xl) return 4;
    if (width >= BREAKPOINTS.lg) return 3;
    if (width >= BREAKPOINTS.md) return 2;
    return 1;
}

export function useScreen(): ScreenInfo {
    const [screen, setScreen] = useState<ScreenInfo>({
        width: 1280,
        height: 800,
        breakpoint: "xl",
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isWide: true,
        columns: 4,
    });

    const update = useCallback(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        setScreen({
            width: w,
            height: h,
            breakpoint: getBreakpoint(w),
            isMobile: w < BREAKPOINTS.md,
            isTablet: w >= BREAKPOINTS.md && w < BREAKPOINTS.lg,
            isDesktop: w >= BREAKPOINTS.lg,
            isWide: w >= BREAKPOINTS.xl,
            columns: getColumns(w),
        });
    }, []);

    useEffect(() => {
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [update]);

    return screen;
}
