"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PackageOpen } from "lucide-react"

interface EmptyStateProps {
    title: string
    description: string
    icon?: ReactNode
    action?: {
        label: string
        onClick: () => void
    }
    className?: string
}

export function EmptyState({
    title,
    description,
    icon,
    action,
    className
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-card/30",
            "animate-fade-in",
            className
        )}>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50 mb-4">
                {icon || <PackageOpen className="h-10 w-10 text-primary" />}
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
                {title}
            </h3>
            <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">
                {description}
            </p>
            {action && (
                <Button
                    onClick={action.onClick}
                    size="lg"
                    className="shadow-lg hover:shadow-xl transition-all"
                >
                    {action.label}
                </Button>
            )}
        </div>
    )
}
