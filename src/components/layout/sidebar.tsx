"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
    Home,
    Receipt,
    Package,
    Boxes,
    BarChart3,
    Users,
    Settings,
    LogOut,
    IceCream,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-context"
import { RoleGate } from "@/lib/auth/role-gate"

interface NavItem {
    href: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    ownerOnly?: boolean
}

const mainNavItems: NavItem[] = [
    {
        href: "/",
        label: "Dashboard",
        icon: Home,
    },
    {
        href: "/transaksi",
        label: "Transaksi",
        icon: Receipt,
    },
    {
        href: "/stok",
        label: "Produk",
        icon: Package,
        ownerOnly: true,
    },
    {
        href: "/stok-barang",
        label: "Stok Barang",
        icon: Boxes,
        ownerOnly: true,
    },
    {
        href: "/laporan",
        label: "Laporan",
        icon: BarChart3,
        ownerOnly: true,
    },
    {
        href: "/users",
        label: "Karyawan",
        icon: Users,
        ownerOnly: true, // Hanya owner yang bisa kelola staff
    },
]

const bottomNavItems: NavItem[] = [
    {
        href: "/profil",
        label: "Pengaturan",
        icon: Settings,
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const { signOut, profile, warung, role } = useAuth()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await signOut()
        } catch (err) {
            console.error("Logout failed:", err)
            setIsLoggingOut(false)
        }
    }

    return (
        <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-60 bg-sidebar border-r border-sidebar-border z-50">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg btn-gradient shadow-lg">
                    <IceCream className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-sidebar-foreground">
                        {warung?.name || "D'Creamy"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {role === "owner" ? "Pemilik" : "Karyawan"}
                    </span>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {mainNavItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href))

                    // Skip owner-only items for staff
                    if (item.ownerOnly && role !== "owner") {
                        return null
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            suppressHydrationWarning
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                    : "text-sidebar-foreground/70"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Section */}
            <div className="px-3 py-4 border-t border-sidebar-border bg-sidebar mt-auto">
                {/* User Info */}
                <div className="flex items-center gap-3 px-3 py-2 mb-3 rounded-lg bg-sidebar-accent/30">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                        {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-sidebar-foreground">
                            {profile?.full_name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {role === "owner" ? "Owner" : "Staff"}
                        </p>
                    </div>
                </div>

                {bottomNavItems.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            suppressHydrationWarning
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-2",
                                "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground/70"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    )
                })}

                <Separator className="my-2" />

                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoggingOut ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <LogOut className="h-5 w-5" />
                    )}
                    {isLoggingOut ? "Keluar..." : "Keluar"}
                </button>
            </div>
        </aside>
    )
}
