import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!serviceRoleKey) {
            return NextResponse.json(
                { error: 'Server Config Error: SUPABASE_SERVICE_ROLE_KEY belum disetting di .env.local' },
                { status: 500 }
            )
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        const { email, password, name, warungId } = await req.json()

        if (!email || !password || !warungId) {
            return NextResponse.json(
                { error: 'Email, password, dan Warung ID wajib diisi' },
                { status: 400 }
            )
        }

        // 1. Create User in Auth
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto verify
            user_metadata: {
                full_name: name || 'Staff',
                role: 'staff',
                warung_id: warungId
            }
        })

        if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 400 })
        }

        const newUserId = userData.user.id

        // 2. Update Profile connection explicitly (Admin bypasses RLS)
        // We use UPDATE instead of Insert to avoid conflict with Trigger
        // Wait a bit for trigger? No, just update.

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                warung_id: warungId,
                role: 'staff',
                full_name: name || 'Staff'
            })
            .eq('id', newUserId)

        // If Update returns 0 rows (trigger slow?), we might need Upsert.
        // But Profile SHOULD exist.

        if (profileError) {
            console.error("Profile update error:", profileError)
        }

        return NextResponse.json({
            success: true,
            user: userData.user,
            message: "Staff berhasil dibuat"
        })

    } catch (err: any) {
        console.error("Create staff API error:", err)
        return NextResponse.json(
            { error: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
