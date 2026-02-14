import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!serviceRoleKey) {
            return NextResponse.json(
                { error: 'Gagal: Fitur Hapus Karyawan ini butuh "Service Role Key". Cek .env.local Anda.' },
                { status: 500 }
            )
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const { staffId } = await req.json()

        if (!staffId) {
            return NextResponse.json({ error: 'Staff ID required' }, { status: 400 })
        }

        // Admin Update: Bypass RLS completely
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ warung_id: null, role: 'user' })
            .eq('id', staffId)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true, message: "Karyawan berhasil dikeluarkan" })

    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
