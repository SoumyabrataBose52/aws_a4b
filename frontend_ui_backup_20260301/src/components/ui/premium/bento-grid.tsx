"use client";

import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";
import { GlassPanel } from "./glass-panel";

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
}) => {
    return (
        <GlassPanel
            className={cn(
                "row-span-1 border border-white/5 p-4 flex flex-col justify-between group/bento",
                className
            )}
        >
            {header && <div className="mb-4">{header}</div>}
            {/* Spacer to push content down if there's no header but we want bottom alignment */}
            <div className="flex-1" />
            <div className="group-hover/bento:translate-x-2 transition duration-200">
                {icon}
                <div className="font-sans font-bold text-neutral-200 mb-2 mt-2">
                    {title}
                </div>
                <div className="font-sans font-normal text-neutral-400 text-xs">
                    {description}
                </div>
            </div>
        </GlassPanel>
    );
};
