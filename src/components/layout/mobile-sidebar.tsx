"use client"

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
    Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth/auth-context"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"

export function MobileSidebar() {
    const pathname = usePathname()
    const { signOut, profile, warung, role } = useAuth()
    const [open, setOpen] = useState(false)

    const navItems = [
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
            ownerOnly: true,
        },
        {
            href: "/profil",
            label: "Pengaturan",
            icon: Settings,
        },
    ]

    const handleLogout = async () => {
        try {
            await signOut()
        } catch (err) {
            console.error("Logout failed:", err)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-2 mr-2">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0">
                <SheetHeader className="px-4 py-4 border-b text-left">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg btn-gradient shadow-lg">
                            <IceCream className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <SheetTitle className="text-base font-bold">
                                {warung?.name || "D'Creamy"}
                            </SheetTitle>
                            <span className="text-xs text-muted-foreground">
                                {role === "owner" ? "Pemilik" : "Karyawan"}
                            </span>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex flex-col h-[calc(100vh-80px)]">
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
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
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                        "hover:bg-muted/50",
                                        isActive
                                            ? "bg-accent text-accent-foreground font-semibold"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="p-4 mt-auto border-t bg-muted/20">
                        <div className="flex items-center gap-3 px-2 py-2 mb-3 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {profile?.full_name || "User"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {process.env.NEXT_PUBLIC_APP_VERSION || "v1.0.0"}
                                </p>
                            </div>
                        </div>

                        <Separator className="my-2" />

                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            Keluar
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
