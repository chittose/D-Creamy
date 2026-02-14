import { Metadata } from "next"

export const metadata: Metadata = {
    title: "D'Creamy Finance",
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg mb-4">
                        <span className="text-3xl">🍦</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">D'Creamy</h1>
                    <p className="text-muted-foreground text-sm">Finance App</p>
                </div>

                {children}
            </div>
        </div>
    )
}
