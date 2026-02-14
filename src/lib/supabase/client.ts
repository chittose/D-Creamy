import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

// Singleton instances to prevent creating new clients on every render.
// Without this, components that call these in their body create new references
// each render, causing useCallback dependency arrays to trigger infinite loops.
let _typedClient: ReturnType<typeof createBrowserClient<Database>> | null = null
let _untypedClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
    if (!_typedClient) {
        _typedClient = createBrowserClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    }
    return _typedClient
}

// Use for dynamic operations where types are too strict or unknown
export function getUntypedSupabaseClient() {
    if (!_untypedClient) {
        _untypedClient = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    }
    return _untypedClient
}
