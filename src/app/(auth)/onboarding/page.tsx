"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Store, Users, ArrowRight, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { getUntypedSupabaseClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type Step = "role" | "owner-setup" | "staff-join"
type Role = "owner" | "staff"

export default function OnboardingPage() {
    const [step, setStep] = useState<Step>("role")
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    // Owner fields
    const [warungName, setWarungName] = useState("")
    const [warungAddress, setWarungAddress] = useState("")
    const [warungPhone, setWarungPhone] = useState("")

    // Staff fields
    const [inviteCode, setInviteCode] = useState("")

    const { user, refreshProfile } = useAuth()
    const router = useRouter()
    const supabase = getUntypedSupabaseClient()

    const handleRoleSelect = (role: Role) => {
        setSelectedRole(role)
        setStep(role === "owner" ? "owner-setup" : "staff-join")
    }

    const handleOwnerSetup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !warungName) return

        setError("")
        setIsLoading(true)

        try {
            // Update profile role
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ role: "owner" })
                .eq("id", user.id)
                .select()

            if (profileError) throw profileError

            // Create warung
            const { error: warungError } = await supabase
                .from("warung")
                .insert({
                    name: warungName,
                    address: warungAddress || null,
                    phone: warungPhone || null,
                    owner_id: user.id,
                })
                .select()

            if (warungError) throw warungError

            await refreshProfile()
            router.push("/")
        } catch (err) {
            console.error("Onboarding setup error:", err)
            setError("Gagal membuat warung. Coba lagi.")
            setIsLoading(false)
        }
    }

    const handleStaffJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !inviteCode) return

        setError("")
        setIsLoading(true)

        try {
            // Find invite code
            const { data: invite, error: inviteError } = await supabase
                .from("staff_invites")
                .select("*")
                .eq("invite_code", inviteCode.toUpperCase())
                .is("used_by", null)
                .gt("expires_at", new Date().toISOString())
                .single()

            if (inviteError || !invite) {
                setError("Kode invite tidak valid atau sudah expired")
                setIsLoading(false)
                return
            }

            // Update profile with role and warung
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ role: "staff", warung_id: invite.warung_id })
                .eq("id", user.id)

            if (profileError) throw profileError

            // Mark invite as used
            await supabase
                .from("staff_invites")
                .update({ used_by: user.id })
                .eq("id", invite.id)

            await refreshProfile()
            router.push("/")
        } catch (err) {
            console.error("Join error:", err)
            setError("Gagal bergabung. Coba lagi.")
            setIsLoading(false)
        }
    }

    // Role Selection Step
    if (step === "role") {
        return (
            <Card className="shadow-xl border-0">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Pilih Peran Kamu</CardTitle>
                    <CardDescription className="text-center">
                        Bagaimana kamu akan menggunakan D'Creamy?
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <button
                        onClick={() => handleRoleSelect("owner")}
                        className={cn(
                            "w-full p-6 rounded-xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5",
                            selectedRole === "owner" ? "border-primary bg-primary/5" : "border-border"
                        )}
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 shrink-0">
                                <Store className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Saya Pemilik Warung</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Buat warung baru dan kelola semua data keuangan
                                </p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleRoleSelect("staff")}
                        className={cn(
                            "w-full p-6 rounded-xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5",
                            selectedRole === "staff" ? "border-primary bg-primary/5" : "border-border"
                        )}
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 shrink-0">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Saya Karyawan</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Gabung ke warung yang sudah ada dengan kode invite
                                </p>
                            </div>
                        </div>
                    </button>
                </CardContent>
            </Card>
        )
    }

    // Owner Setup Step
    if (step === "owner-setup") {
        return (
            <Card className="shadow-xl border-0">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Buat Warung Baru</CardTitle>
                    <CardDescription className="text-center">
                        Isi informasi warung kamu
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleOwnerSetup}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="warungName">Nama Warung *</Label>
                            <Input
                                id="warungName"
                                placeholder="D'Creamy Minuman"
                                value={warungName}
                                onChange={(e) => setWarungName(e.target.value)}
                                required
                                className="h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="warungAddress">Alamat (opsional)</Label>
                            <Input
                                id="warungAddress"
                                placeholder="Jl. Raya No. 123"
                                value={warungAddress}
                                onChange={(e) => setWarungAddress(e.target.value)}
                                className="h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="warungPhone">No. Telepon (opsional)</Label>
                            <Input
                                id="warungPhone"
                                type="tel"
                                placeholder="08123456789"
                                value={warungPhone}
                                onChange={(e) => setWarungPhone(e.target.value)}
                                className="h-12"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12"
                                onClick={() => setStep("role")}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-12 font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                                disabled={isLoading || !warungName}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Membuat...
                                    </>
                                ) : (
                                    <>
                                        Buat Warung
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </form>
            </Card>
        )
    }

    // Staff Join Step
    if (step === "staff-join") {
        return (
            <Card className="shadow-xl border-0">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Gabung ke Warung</CardTitle>
                    <CardDescription className="text-center">
                        Masukkan kode invite dari pemilik warung
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleStaffJoin}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="inviteCode">Kode Invite</Label>
                            <Input
                                id="inviteCode"
                                placeholder="ABC123"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                required
                                className="h-14 text-center text-2xl tracking-widest font-mono uppercase"
                                maxLength={6}
                            />
                            <p className="text-xs text-muted-foreground text-center">
                                Minta kode invite dari pemilik warung
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12"
                                onClick={() => setStep("role")}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-12 font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                                disabled={isLoading || inviteCode.length < 6}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Bergabung...
                                    </>
                                ) : (
                                    <>
                                        Gabung
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </form>
            </Card>
        )
    }

    return null
}
