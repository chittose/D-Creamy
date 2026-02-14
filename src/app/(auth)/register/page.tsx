"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"

export default function RegisterPage() {
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { signUp } = useAuth()
    const router = useRouter()

    // Password validation
    const hasMinLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const passwordsMatch = password === confirmPassword && password.length > 0
    const isPasswordValid = hasMinLength && hasUpperCase && hasNumber

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!isPasswordValid) {
            setError("Password tidak memenuhi kriteria")
            return
        }

        if (!passwordsMatch) {
            setError("Password tidak cocok")
            return
        }

        setIsLoading(true)

        const { error: signUpError } = await signUp(email, password, fullName)

        if (signUpError) {
            setError(
                signUpError.message.includes("already registered")
                    ? "Email sudah terdaftar"
                    : signUpError.message
            )
            setIsLoading(false)
            return
        }

        // Redirect to onboarding
        router.push("/onboarding")
    }

    const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
        <div className={cn("flex items-center gap-2 text-sm", valid ? "text-income" : "text-muted-foreground")}>
            {valid ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {text}
        </div>
    )

    return (
        <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Daftar Akun</CardTitle>
                <CardDescription className="text-center">
                    Buat akun baru untuk mulai menggunakan D'Creamy
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
                        <Label htmlFor="fullName">Nama Lengkap</Label>
                        <Input
                            id="fullName"
                            type="text"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            autoComplete="name"
                            className="h-12"
                        />
                    </div>

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

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                className="h-12 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>

                        {/* Password requirements */}
                        {password.length > 0 && (
                            <div className="pt-2 space-y-1">
                                <ValidationItem valid={hasMinLength} text="Minimal 8 karakter" />
                                <ValidationItem valid={hasUpperCase} text="Minimal 1 huruf besar" />
                                <ValidationItem valid={hasNumber} text="Minimal 1 angka" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                        <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            className={cn(
                                "h-12",
                                confirmPassword.length > 0 && (passwordsMatch ? "border-income" : "border-expense")
                            )}
                        />
                        {confirmPassword.length > 0 && (
                            <ValidationItem valid={passwordsMatch} text={passwordsMatch ? "Password cocok" : "Password tidak cocok"} />
                        )}
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                    <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                        disabled={isLoading || !isPasswordValid || !passwordsMatch || !fullName || !email}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Mendaftar...
                            </>
                        ) : (
                            "Daftar"
                        )}
                    </Button>

                    <p className="text-sm text-center text-muted-foreground">
                        Sudah punya akun?{" "}
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Masuk di sini
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}
