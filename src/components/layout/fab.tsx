"use client"

import { ReactNode } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FABProps {
    onClick?: () => void
    icon?: ReactNode
    label?: string
    className?: string
}

export function FAB({
    onClick,
    icon = <Plus className="h-6 w-6" />,
    label,
    className
}: FABProps) {
    return (
        <Button
            onClick={onClick}
            size="lg"
            className={cn(
                "fixed bottom-20 right-4 md:bottom-6 md:right-6 h-14 rounded-full shadow-lg z-40",
                "bg-primary hover:bg-primary/90 text-primary-foreground",
                "touch-target transition-transform active:scale-95",
                label ? "px-6 gap-2" : "w-14",
                className
            )}
        >
            {icon}
            {label && <span className="font-medium">{label}</span>}
        </Button>
    )
}
