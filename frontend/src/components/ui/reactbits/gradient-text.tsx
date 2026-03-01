interface GradientTextProps {
    children: React.ReactNode;
    className?: string;
    from?: string;
    via?: string;
    to?: string;
}

export function GradientText({
    children,
    className = "",
    from = "#6366f1",
    via = "#8b5cf6",
    to = "#ec4899",
}: GradientTextProps) {
    return (
        <span
            className={`bg-clip-text text-transparent ${className}`}
            style={{
                backgroundImage: `linear-gradient(135deg, ${from}, ${via}, ${to})`,
            }}
        >
            {children}
        </span>
    );
}
