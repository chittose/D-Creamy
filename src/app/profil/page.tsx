"use client"

import { AdaptiveShell, Header } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Store,
    MapPin,
    Phone,
    Mail,
    Bell,
    Moon,
    Smartphone,
    ChevronRight,
    LogOut,
    Loader2,
    Pencil,
    Upload
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { useState, useEffect } from "react"
import { getUntypedSupabaseClient } from "@/lib/supabase/client"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProfilPage() {
    const { user, profile, warung, role, signOut, isLoading } = useAuth()
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [isFixing, setIsFixing] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({ fullName: "" })
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isEditingWarung, setIsEditingWarung] = useState(false)
    const [warungForm, setWarungForm] = useState({ name: "", address: "", phone: "" })
    const [isSavingWarung, setIsSavingWarung] = useState(false)
    const supabase = getUntypedSupabaseClient()

    // Initialize edit form when profile loads
    useEffect(() => {
        if (profile) {
            setEditForm({ fullName: profile.full_name || "" })
        }
    }, [profile])

    useEffect(() => {
        if (warung) {
            setWarungForm({
                name: warung.name || "",
                address: warung.address || "",
                phone: warung.phone || ""
            })
        }
    }, [warung])


    const handleLogout = async () => {
        setIsLoggingOut(true)
        await signOut()
    }

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setIsSaving(true)

        try {
            let avatarUrl = profile?.avatar_url

            // 1. Upload Avatar if changed
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop()
                const fileName = `${user.id}-${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile, { upsert: true })

                if (uploadError) throw uploadError

                const { data: urlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName)

                avatarUrl = urlData.publicUrl
            }

            // 2. Update Profile
            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    full_name: editForm.fullName,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq("id", user.id)

            if (updateError) throw updateError

            alert("Profil berhasil diperbarui!")
            setIsEditing(false)
            window.location.reload() // Refresh to update context
        } catch (err: any) {
            console.error("Update profile error:", err)
            alert("Gagal update profil: " + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveWarung = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!warung || role !== "owner") return
        setIsSavingWarung(true)

        try {
            const { error } = await supabase
                .from("warung")
                .update({
                    name: warungForm.name,
                    address: warungForm.address,
                    phone: warungForm.phone,
                })
                .eq("id", warung.id)

            if (error) throw error

            alert("Info Warung berhasil diperbarui!")
            setIsEditingWarung(false)
            window.location.reload()
        } catch (err: any) {
            alert("Gagal: " + err.message)
        } finally {
            setIsSavingWarung(false)
        }
    }

    // Reuse handleFixWarung logic from Step 955/963 (Corrected version here)
    const handleFixWarung = async () => {
        if (!user) return
        setIsFixing(true)
        try {
            const { error: warungError } = await supabase
                .from("warung")
                .insert({
                    name: "Warung Saya",
                    address: "Indonesia",
                    owner_id: user.id,
                })

            if (warungError) throw warungError // Simplified error handle

            await supabase.from("profiles").update({ role: 'owner' }).eq('id', user.id)
            alert("Data Warung berhasil diperbaiki!")
            window.location.reload()
        } catch (err: any) {
            if (err?.code === "23505") {
                alert("Warung sudah ada. Refresh...")
                window.location.reload()
            } else {
                alert("Gagal: " + err.message)
            }
        } finally {
            setIsFixing(false)
        }
    }

    if (isLoading) {
        return (
            <AdaptiveShell>
                <Header title="Profil" />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdaptiveShell>
        )
    }

    return (
        <AdaptiveShell>
            <Header title="Profil" subtitle="Kelola akun & warung" />

            <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
                {/* UPDATE PROFILE DIALOG */}
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Profil</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div className="flex flex-col items-center gap-4 py-4">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={avatarFile ? URL.createObjectURL(avatarFile) : (profile?.avatar_url || "")} />
                                    <AvatarFallback>{profile?.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="avatar-upload" className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2 rounded-md inline-flex items-center text-sm font-medium transition-colors">
                                        <Upload className="mr-2 h-4 w-4" />
                                        Ganti Foto
                                    </Label>
                                    <Input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setAvatarFile(e.target.files[0])
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Nama Lengkap</Label>
                                <Input
                                    value={editForm.fullName}
                                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                                    placeholder="Nama Anda"
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isSaving}>
                                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* FIX DATA WARNING */}
                {role === "owner" && !warung && (
                    <div className="p-4 rounded-lg bg-orange-100 border border-orange-200 text-orange-800 space-y-3">
                        <div className="flex items-center gap-2 font-semibold">
                            <Store className="h-5 w-5" />
                            Data Warung Belum Siap
                        </div>
                        <Button onClick={handleFixWarung} disabled={isFixing} className="w-full bg-orange-600 text-white">
                            {isFixing ? "Memproses..." : "Inisialisasi Data Warung (Fix)"}
                        </Button>
                    </div>
                )}

                {/* Profile Card */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="relative">
                                <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 border-border">
                                    <AvatarImage src={profile?.avatar_url || ""} />
                                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                        {profile?.full_name?.charAt(0)?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <Button
                                    size="icon"
                                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-md"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex-1 text-center md:text-left space-y-1">
                                <h2 className="text-xl md:text-2xl font-bold flex items-center justify-center md:justify-start gap-2">
                                    {profile?.full_name || "User"}
                                    <Badge variant={role === "owner" ? "default" : "secondary"}>
                                        {role === "owner" ? "Pemilik" : "Karyawan"}
                                    </Badge>
                                </h2>
                                <p className="text-muted-foreground">{user?.email}</p>
                                <p className="text-sm text-muted-foreground">{warung?.name || "Belum ada warung"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Warung Info */}
                {warung && (
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Store className="h-5 w-5 text-orange-500" />
                                    Info Warung
                                </CardTitle>
                                {role === "owner" && (
                                    <Dialog open={isEditingWarung} onOpenChange={setIsEditingWarung}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">Ubah</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Ubah Info Warung</DialogTitle>
                                            </DialogHeader>
                                            <form onSubmit={handleSaveWarung} className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Nama Warung</Label>
                                                    <Input
                                                        value={warungForm.name}
                                                        onChange={e => setWarungForm({ ...warungForm, name: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Alamat</Label>
                                                    <Input
                                                        value={warungForm.address}
                                                        onChange={e => setWarungForm({ ...warungForm, address: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Nomor Telepon Warung</Label>
                                                    <Input
                                                        value={warungForm.phone}
                                                        onChange={e => setWarungForm({ ...warungForm, phone: e.target.value })}
                                                        placeholder="08..."
                                                    />
                                                </div>
                                                <Button type="submit" className="w-full" disabled={isSavingWarung}>
                                                    {isSavingWarung ? "Menyimpan..." : "Simpan Perubahan"}
                                                </Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Nama Warung</p>
                                <div className="p-3 bg-muted/50 rounded-lg font-medium border">
                                    {warung.name}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Alamat</p>
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                                    <span className="font-medium">{warung.address || "-"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Kontak</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">{user?.email}</p>
                                <p className="text-xs text-muted-foreground">Email</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">{warung?.phone || "-"}</p>
                                <p className="text-xs text-muted-foreground">Telepon</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Pengaturan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <Bell className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">Notifikasi</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Button
                    variant="destructive"
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <LogOut className="h-5 w-5" />
                    )}
                    Keluar dari Akun
                </Button>

                {/* Developer Tool */}
                <div className="pt-8 flex justify-center opacity-50 hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={async () => {
                            if (!user) return
                            if (!confirm("DEV: Paksa ubah status akun Anda menjadi OWNER?")) return
                            try {
                                await supabase.from("profiles").update({ role: "owner" }).eq("id", user.id)
                                alert("Sukses! Anda sekarang Owner. Refresh...")
                                window.location.reload()
                            } catch (err: any) { alert("Gagal: " + err.message) }
                        }}
                    >
                        🔧 Dev: Force Role to Owner
                    </Button>
                </div>
            </div>
        </AdaptiveShell>
    )
}
