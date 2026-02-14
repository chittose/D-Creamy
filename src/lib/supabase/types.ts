// D'Creamy Finance App - Supabase Database Types
// Generated from Supabase schema - update when schema changes

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                    full_name: string | null
                    phone: string | null
                    avatar_url: string | null
                    role: 'owner' | 'staff'
                    warung_id: string | null // For staff assignment
                }
                Insert: {
                    id: string
                    created_at?: string
                    updated_at?: string
                    full_name?: string | null
                    phone?: string | null
                    avatar_url?: string | null
                    role?: 'owner' | 'staff'
                    warung_id?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    full_name?: string | null
                    phone?: string | null
                    avatar_url?: string | null
                    role?: 'owner' | 'staff'
                    warung_id?: string | null
                }
            }
            staff_invites: {
                Row: {
                    id: string
                    created_at: string
                    warung_id: string
                    invite_code: string
                    expires_at: string
                    used_by: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    warung_id: string
                    invite_code: string
                    expires_at: string
                    used_by?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    warung_id?: string
                    invite_code?: string
                    expires_at?: string
                    used_by?: string | null
                }
            }
            warung: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                    name: string
                    address: string | null
                    phone: string | null
                    logo_url: string | null
                    owner_id: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    name: string
                    address?: string | null
                    phone?: string | null
                    logo_url?: string | null
                    owner_id: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    name?: string
                    address?: string | null
                    phone?: string | null
                    logo_url?: string | null
                    owner_id?: string
                }
            }
            products: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                    warung_id: string
                    name: string
                    buy_price: number
                    sell_price: number
                    stock: number
                    category: string
                    emoji: string | null
                    image_url: string | null
                    is_active: boolean
                }
                Insert: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    warung_id: string
                    name: string
                    buy_price: number
                    sell_price: number
                    stock?: number
                    category: string
                    emoji?: string | null
                    image_url?: string | null
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    warung_id?: string
                    name?: string
                    buy_price?: number
                    sell_price?: number
                    stock?: number
                    category?: string
                    emoji?: string | null
                    image_url?: string | null
                    is_active?: boolean
                }
            }
            transactions: {
                Row: {
                    id: string
                    created_at: string
                    warung_id: string
                    type: 'income' | 'expense'
                    amount: number
                    product_id: string | null
                    quantity: number | null
                    category: string
                    note: string | null
                    receipt_url: string | null
                    created_by: string
                    payment_method?: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    warung_id: string
                    type: 'income' | 'expense'
                    amount: number
                    product_id?: string | null
                    quantity?: number | null
                    category: string
                    note?: string | null
                    receipt_url?: string | null
                    created_by: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    warung_id?: string
                    type?: 'income' | 'expense'
                    amount?: number
                    product_id?: string | null
                    quantity?: number | null
                    category?: string
                    note?: string | null
                    receipt_url?: string | null
                    created_by?: string
                }
            }
            stock_items: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                    warung_id: string
                    name: string
                    quantity: number
                    unit: string
                    min_stock: number
                    is_active: boolean
                }
                Insert: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    warung_id: string
                    name: string
                    quantity?: number
                    unit?: string
                    min_stock?: number
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    warung_id?: string
                    name?: string
                    quantity?: number
                    unit?: string
                    min_stock?: number
                    is_active?: boolean
                }
            }
            product_stock_usage: {
                Row: {
                    id: string
                    product_id: string
                    stock_item_id: string
                    quantity_used: number
                }
                Insert: {
                    id?: string
                    product_id: string
                    stock_item_id: string
                    quantity_used?: number
                }
                Update: {
                    id?: string
                    product_id?: string
                    stock_item_id?: string
                    quantity_used?: number
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: 'owner' | 'staff'
            transaction_type: 'income' | 'expense'
        }
    }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Warung = Database['public']['Tables']['warung']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type StockItem = Database['public']['Tables']['stock_items']['Row']
export type ProductStockUsage = Database['public']['Tables']['product_stock_usage']['Row']

export type InsertProfile = Database['public']['Tables']['profiles']['Insert']
export type InsertWarung = Database['public']['Tables']['warung']['Insert']
export type InsertProduct = Database['public']['Tables']['products']['Insert']
export type InsertTransaction = Database['public']['Tables']['transactions']['Insert']
export type InsertStockItem = Database['public']['Tables']['stock_items']['Insert']
export type InsertProductStockUsage = Database['public']['Tables']['product_stock_usage']['Insert']
