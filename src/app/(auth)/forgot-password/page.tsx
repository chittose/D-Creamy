"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Mail } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isEmailSent, setIsEmailSent] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        const supabase = getSupabaseClient()

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        })

        if (resetError) {
            console.error(resetError)
            setError(resetError.message || "Gagal mengirim email reset password. Coba lagi.")
            setIsLoading(false)
            return
        }

        setIsEmailSent(true)
        setIsLoading(false)
    }

    if (isEmailSent) {
        return (
            <Card className="shadow-xl border-0">
                <CardContent className="pt-8 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-income/10 text-income mx-auto">
                        <Mail className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-semibold">Email Terkirim!</h2>
                    <p className="text-muted-foreground text-sm">
                        Kami telah mengirim link reset password ke <strong>{email}</strong>.
                        Silakan cek inbox atau folder spam kamu.
                    </p>
                    <Link href="/login">
                        <Button variant="outline" className="mt-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali ke Login
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Lupa Password?</CardTitle>
                <CardDescription className="text-center">
                    Masukkan email kamu untuk mendapatkan link reset password
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="nama@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="h-12"
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                    <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                        disabled={isLoading || !email}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Mengirim...
                            </>
                        ) : (
                            "Kirim Link Reset"
                        )}
                    </Button>

                    <Link href="/login" className="w-full">
                        <Button variant="ghost" className="w-full">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali ke Login
                        </Button>
                    </Link>
                </CardFooter>
            </form>
        </Card>
    )
}
