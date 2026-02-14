"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getUntypedSupabaseClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"
import type { Profile, Warung } from "@/lib/supabase/types"

export type UserRole = "owner" | "staff"

interface AuthContextType {
    user: User | null
    session: Session | null
    profile: Profile | null
    warung: Warung | null
    role: UserRole | null
    isLoading: boolean
    isAuthenticated: boolean
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
}

const initialAuthContext: AuthContextType = {
    user: null,
    session: null,
    profile: null,
    warung: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
    signIn: async () => ({ error: new Error("Auth not initialized") }),
    signUp: async () => ({ error: new Error("Auth not initialized") }),
    signOut: async () => { },
    refreshProfile: async () => { }
}

const AuthContext = createContext<AuthContextType>(initialAuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [warung, setWarung] = useState<Warung | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const supabase = getUntypedSupabaseClient()

    // Fetch profile and warung for a user
    const fetchUserData = useCallback(async (userId: string) => {
        try {
            // Fetch profile
            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single()

            if (profileData) {
                setProfile(profileData as Profile)

                // If owner, fetch their warung
                if (profileData.role === "owner") {
                    const { data: warungData } = await supabase
                        .from("warung")
                        .select("*")
                        .eq("owner_id", userId)
                        .single()

                    setWarung(warungData as Warung | null)
                }
                // If staff, fetch warung they belong to
                else if (profileData.role === "staff" && (profileData as Profile & { warung_id?: string }).warung_id) {
                    const { data: warungData } = await supabase
                        .from("warung")
                        .select("*")
                        .eq("id", (profileData as Profile & { warung_id?: string }).warung_id)
                        .single()

                    setWarung(warungData as Warung | null)
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error)
        }
    }, [supabase])

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession()

                if (currentSession?.user) {
                    setSession(currentSession)
                    setUser(currentSession.user)
                    // Fetch data in background, don't block app loading
                    fetchUserData(currentSession.user.id).catch(console.error)
                }
            } catch (error) {
                console.error("Auth init error:", error)
            } finally {
                setIsLoading(false)
            }
        }

        initAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: string, newSession: Session | null) => {
                setSession(newSession)
                setUser(newSession?.user ?? null)

                if (newSession?.user) {
                    await fetchUserData(newSession.user.id)
                } else {
                    setProfile(null)
                    setWarung(null)
                }

                if (event === "SIGNED_OUT") {
                    router.push("/login")
                }
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase, fetchUserData, router])

    // Sign in
    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error
            return { error: null }
        } catch (error) {
            return { error: error as Error }
        }
    }

    // Sign up
    const signUp = async (email: string, password: string, fullName: string) => {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            })

            if (error) throw error
            return { error: null }
        } catch (error) {
            return { error: error as Error }
        }
    }

    // Sign out
    const signOut = async () => {
        try {
            // Attempt server signout but proceed even if it fails/hangs
            supabase.auth.signOut()
        } catch (error) {
            console.error("Server signout failed:", error)
        }

        // Force local state cleanup
        setUser(null)
        setSession(null)
        setProfile(null)
        setWarung(null)

        // Clear persistence
        if (typeof window !== 'undefined') {
            localStorage.clear()
            sessionStorage.clear()
        }

        // Force redirect
        router.refresh()
        router.replace("/login")
    }

    // Refresh profile
    const refreshProfile = async () => {
        if (user) {
            await fetchUserData(user.id)
        }
    }

    const role: UserRole | null = profile?.role as UserRole | null

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                profile,
                warung,
                role,
                isLoading,
                isAuthenticated: !!session,
                signIn,
                signUp,
                signOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
