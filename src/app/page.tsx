import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardClient from "./dashboard-client"
import { getBusinessDayStart } from "@/lib/business-day"
import type { Profile, Warung } from "@/lib/supabase/types"

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Get User
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // 2. Get Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    // Handle error or redirect to onboarding
    return <div>Error loading profile</div>
  }

  // 3. Get Warung logic
  let warung: Warung | null = null
  const typedProfile = profile as Profile

  if (typedProfile.role === "owner") {
    const { data } = await supabase
      .from("warung")
      .select("*")
      .eq("owner_id", user.id)
      .single()
    warung = data as Warung | null
  } else if (typedProfile.role === "staff" && (typedProfile as any).warung_id) {
    const { data } = await supabase
      .from("warung")
      .select("*")
      .eq("id", (typedProfile as any).warung_id)
      .single()
    warung = data as Warung | null
  }

  // 4. Get Transactions (if warung exists)
  let transactions: any[] = []

  if (warung) {
    const startDate = getBusinessDayStart()
    const { data } = await supabase
      .from("transactions")
      .select(`
        id,
        type,
        payment_method,
        amount,
        category,
        note,
        created_at,
        product:products(name),
        profile:profiles!created_by(full_name)
      `)
      .eq("warung_id", warung.id)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false })

    if (data) transactions = data
  }

  return (
    <DashboardClient
      initialTransactions={transactions}
      user={user}
      warung={warung}
    />
  )
}
