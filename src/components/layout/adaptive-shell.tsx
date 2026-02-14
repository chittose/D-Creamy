"use client"

import { ReactNode } from "react"
import { Sidebar } from "./sidebar"


interface AdaptiveShellProps {
    children: ReactNode
}

export function AdaptiveShell({ children }: AdaptiveShellProps) {
    return (
        <div className="min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="md:pl-60 min-h-screen">
                {children}
            </main>
        </div>
    )
}
