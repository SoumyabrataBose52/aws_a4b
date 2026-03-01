import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    actionHref?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, actionHref }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="p-4 rounded-2xl bg-accent-brand/5 border border-accent-brand/10 mb-4">
                <Icon size={32} className="text-accent-brand/50" />
            </div>
            <h3 className="text-base font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-[320px] mb-5">{description}</p>
            {actionLabel && (
                actionHref ? (
                    <a href={actionHref}>
                        <Button size="sm" className="bg-accent-brand hover:bg-accent-brand/90 text-white">
                            {actionLabel}
                        </Button>
                    </a>
                ) : (
                    <Button size="sm" onClick={onAction} className="bg-accent-brand hover:bg-accent-brand/90 text-white">
                        {actionLabel}
                    </Button>
                )
            )}
        </div>
    );
}
