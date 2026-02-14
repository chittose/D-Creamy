"use client"

import { useState, useEffect } from "react"
import { AdaptiveShell, Header } from "@/components/layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth/auth-context"
import { getUntypedSupabaseClient } from "@/lib/supabase/client"
import { Copy, Plus, MoreVertical, Trash2, UserPlus, ShieldAlert, Users } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface StaffProfile {
    id: string
    full_name: string
    email: string // Note: profiles might not have email stored directly if specific constraint, but let's assume we join or fetch from auth? 
    // Wait, profile table usually doesn't have email. Check schema.
    // Schema schema.sql: profiles (id, full_name, avatar_url...). NO EMAIL.
    // Email is in auth.users. 
    // RLS prevents viewing auth.users.
    // workaround: We can't display email unless we duplicated it to profiles.
    // Or, we accept viewing name only.
    avatar_url: string | null
    role: string
}

export default function UsersPage() {
    const { warung, role, user } = useAuth()
    const [staffList, setStaffList] = useState<StaffProfile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [inviteOpen, setInviteOpen] = useState(false)
    const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "123" })
    const [isCreating, setIsCreating] = useState(false)
    const supabase = getUntypedSupabaseClient()

    // Redirect if not owner
    if (role === "staff") {
        return (
            <AdaptiveShell>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                    <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
                    <h2 className="text-xl font-bold">Akses Ditolak</h2>
                    <p className="text-muted-foreground mt-2">Hanya pemilik warung yang dapat mengakses halaman ini.</p>
                </div>
            </AdaptiveShell>
        )
    }

    const fetchStaff = async () => {
        if (!warung?.id) return
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("warung_id", warung.id)
                .neq("id", user?.id) // Exclude self (owner)

            if (error) throw error
            setStaffList(data || [])
        } catch (err) {
            console.error("Fetch staff error:", err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (warung?.id) {
            fetchStaff()
        }
    }, [warung?.id])

    const handleCopyId = () => {
        if (warung?.id) {
            navigator.clipboard.writeText(warung.id)
            alert("ID Warung berhasil disalin!")
        }
    }

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!warung?.id) return

        setIsCreating(true)
        try {
            const res = await fetch('/api/staff/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newStaff.name,
                    email: newStaff.email,
                    password: newStaff.password, // default '123' if hidden
                    warungId: warung.id
                })
            })

            const data = await res.json()

            if (!res.ok) {
                // Check specific env error
                if (data.error && data.error.includes("SUPABASE_SERVICE_ROLE_KEY")) {
                    alert("⚠️ GAGAL: Fitur ini memerlukan 'Service Role Key'.\n\nOwner, tolong tambahkan SUPABASE_SERVICE_ROLE_KEY di file .env.local Anda untuk mengaktifkan fitur 'Tambah Langsung'.\n\nGunakan metode 'Kode Undangan' sementara waktu.")
                } else {
                    throw new Error(data.error || "Gagal membuat akun")
                }
                return
            }

            alert(`✅ Sukses! Akun ${newStaff.email} telah dibuat.\nPassword: ${newStaff.password}\nStatus: Terverifikasi (Langsung bisa login).`)
            setNewStaff({ name: "", email: "", password: "123" }) // reset
            setInviteOpen(false)
            fetchStaff() // Refresh list

        } catch (err: any) {
            alert("Error: " + err.message)
        } finally {
            setIsCreating(false)
        }
    }

    const handleKick = async (staffId: string) => {
        if (!confirm("Keluarkan karyawan ini dari warung?")) return

        try {
            const res = await fetch('/api/staff/kick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staffId })
            })

            const data = await res.json()

            if (!res.ok) {
                if (data.error && data.error.includes("Service Role Key")) {
                    alert("⚠️ Owner: Tambahkan 'SUPABASE_SERVICE_ROLE_KEY' di .env.local untuk fitur Hapus Karyawan.")
                } else {
                    throw new Error(data.error || "Gagal menghapus")
                }
                return
            }

            fetchStaff()
            alert("✅ Karyawan berhasil dikeluarkan.")
        } catch (err: any) {
            console.error("Kick error:", err)
            alert("Gagal: " + err.message)
        }
    }

    return (
        <AdaptiveShell>
            <Header title="Kelola Karyawan" subtitle="Daftar staff an warung Anda" />

            <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
                {/* Invite Card / Header Action */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-lg border">
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            Tambah Karyawan
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-lg mt-1">
                            Tambahkan karyawan baru ke warung Anda.
                        </p>
                    </div>
                    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                        <DialogTrigger asChild>
                            <Button className="shrink-0 gap-2">
                                <Plus className="h-4 w-4" />
                                Tambah Karyawan
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Tambah Karyawan Baru</DialogTitle>
                                <DialogDescription>
                                    Pilih metode penambahan karyawan.
                                </DialogDescription>
                            </DialogHeader>

                            <Tabs defaultValue="direct" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="direct">Input Langsung</TabsTrigger>
                                    <TabsTrigger value="invite">Kode Undangan</TabsTrigger>
                                </TabsList>

                                <TabsContent value="direct" className="space-y-4 py-4">
                                    <form onSubmit={handleCreateStaff} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Nama Lengkap</Label>
                                            <Input
                                                placeholder="Contoh: Budi Santoso"
                                                required
                                                value={newStaff.name}
                                                onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email Login</Label>
                                            <Input
                                                type="email"
                                                placeholder="email@karyawan.com"
                                                required
                                                value={newStaff.email}
                                                onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Password Awal</Label>
                                            <Input
                                                type="text"
                                                value={newStaff.password}
                                                onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                                                minLength={6}
                                            />
                                            <p className="text-xs text-muted-foreground">Password ini bisa diganti karyawan nanti.</p>
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isCreating}>
                                            {isCreating ? "Membuat Akun..." : "Buat Akun Karyawan"}
                                        </Button>
                                    </form>
                                </TabsContent>

                                <TabsContent value="invite" className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>ID Warung</Label>
                                        <div className="flex items-center gap-2">
                                            <Input readOnly value={warung?.id || "Loading..."} className="bg-muted font-mono" />
                                            <Button size="icon" variant="outline" onClick={handleCopyId} type="button">
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
                                        <p className="font-semibold mb-1">Instruksi:</p>
                                        Minta karyawan Anda mendaftar sendiri di aplikasi, pilih role "Karyawan", dan masukkan Kode ID Warung ini.
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Staff List */}
                <Card>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground">Memuat data karyawan...</div>
                        ) : staffList.length === 0 ? (
                            <div className="p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <Users className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg">Belum Ada Karyawan</h3>
                                <p className="text-muted-foreground max-w-sm mt-1">
                                    Warung Anda belum memiliki karyawan terdaftar. Gunakan tombol di atas untuk mengundang.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {staffList.map((staff) => (
                                    <div key={staff.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={staff.avatar_url || ""} />
                                            <AvatarFallback>{staff.full_name?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{staff.full_name || "Tanpa Nama"}</p>
                                            <Badge variant="secondary" className="mt-1 text-xs font-normal">
                                                Staff
                                            </Badge>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => handleKick(staff.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Keluarkan
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdaptiveShell>
    )
}
