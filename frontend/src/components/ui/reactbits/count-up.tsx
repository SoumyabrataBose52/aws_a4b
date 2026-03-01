"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
    value: number;
    duration?: number;
    format?: (value: number) => string;
    className?: string;
}

export function CountUp({ value, duration = 1000, format, className = "" }: CountUpProps) {
    const [display, setDisplay] = useState(0);
    const startRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        startRef.current = null;
        const startVal = display;

        const step = (timestamp: number) => {
            if (!startRef.current) startRef.current = timestamp;
            const progress = Math.min((timestamp - startRef.current) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setDisplay(startVal + (value - startVal) * eased);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(step);
            }
        };

        rafRef.current = requestAnimationFrame(step);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [value, duration]);

    const formatted = format ? format(display) : Math.round(display).toLocaleString();

    return <span className={className}>{formatted}</span>;
}
