"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    delay?: number;
    className?: string;
    format?: (value: number) => string;
}

export function AnimatedNumber({ value, duration = 2000, delay = 0, className, format }: AnimatedNumberProps) {
    const spring = useSpring(0, { bounce: 0, duration: duration });

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            spring.set(value);
        }, delay);
        return () => clearTimeout(timeoutId);
    }, [spring, value, delay]);

    const formatted = useTransform(spring, (current) => {
        if (format) return format(current);
        return Math.floor(current).toString();
    });

    return <motion.span className={className}>{formatted}</motion.span>;
}
