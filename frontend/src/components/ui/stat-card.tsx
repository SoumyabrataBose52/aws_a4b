import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CountUp } from "@/components/ui/reactbits/count-up";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface StatCardProps {
    label: string;
    value: number;
    format?: (v: number) => string;
    icon: LucideIcon;
    delta?: number; // percentage change
    deltaLabel?: string;
    className?: string;
}

export function StatCard({ label, value, format, icon: Icon, delta, deltaLabel, className = "" }: StatCardProps) {
    const getDeltaColor = () => {
        if (!delta || delta === 0) return "text-muted-foreground";
        return delta > 0 ? "text-success" : "text-danger";
    };

    const DeltaIcon = !delta || delta === 0 ? Minus : delta > 0 ? ArrowUp : ArrowDown;

    return (
        <Card className={`card-glow bg-card border-border ${className}`}>
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-micro">{label}</span>
                    <div className="p-2 rounded-lg bg-accent-brand/10">
                        <Icon size={16} className="text-accent-brand" />
                    </div>
                </div>
                <div className="text-2xl font-bold tracking-tight">
                    <CountUp value={value} format={format} />
                </div>
                {delta !== undefined && (
                    <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${getDeltaColor()}`}>
                        <DeltaIcon size={12} />
                        <span>{Math.abs(delta)}%</span>
                        {deltaLabel && <span className="text-muted-foreground ml-1">{deltaLabel}</span>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
