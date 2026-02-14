-- ============================================
-- FIX: Drop existing policies first, then recreate
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing policies (safe even if they don't exist)
DROP POLICY IF EXISTS "Users can view stock items of their warung" ON stock_items;
DROP POLICY IF EXISTS "Owners can insert stock items" ON stock_items;
DROP POLICY IF EXISTS "Owners can update stock items" ON stock_items;
DROP POLICY IF EXISTS "Owners can delete stock items" ON stock_items;
DROP POLICY IF EXISTS "Users can view product stock usage" ON product_stock_usage;
DROP POLICY IF EXISTS "Owners can manage product stock usage" ON product_stock_usage;

-- Ensure tables exist
CREATE TABLE IF NOT EXISTS stock_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    warung_id UUID NOT NULL REFERENCES warung(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'pcs',
    min_stock INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS product_stock_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    quantity_used INTEGER NOT NULL DEFAULT 1,
    UNIQUE(product_id, stock_item_id)
);

-- Enable RLS
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_stock_usage ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Users can view stock items of their warung"
    ON stock_items FOR SELECT
    USING (warung_id IN (
        SELECT id FROM warung WHERE owner_id = auth.uid()
        UNION
        SELECT warung_id FROM profiles WHERE id = auth.uid() AND warung_id IS NOT NULL
    ));

CREATE POLICY "Owners can insert stock items"
    ON stock_items FOR INSERT
    WITH CHECK (warung_id IN (
        SELECT id FROM warung WHERE owner_id = auth.uid()
    ));

CREATE POLICY "Owners can update stock items"
    ON stock_items FOR UPDATE
    USING (warung_id IN (
        SELECT id FROM warung WHERE owner_id = auth.uid()
    ));

CREATE POLICY "Owners can delete stock items"
    ON stock_items FOR DELETE
    USING (warung_id IN (
        SELECT id FROM warung WHERE owner_id = auth.uid()
    ));

CREATE POLICY "Users can view product stock usage"
    ON product_stock_usage FOR SELECT
    USING (product_id IN (
        SELECT id FROM products WHERE warung_id IN (
            SELECT id FROM warung WHERE owner_id = auth.uid()
            UNION
            SELECT warung_id FROM profiles WHERE id = auth.uid() AND warung_id IS NOT NULL
        )
    ));

CREATE POLICY "Owners can manage product stock usage"
    ON product_stock_usage FOR ALL
    USING (product_id IN (
        SELECT id FROM products WHERE warung_id IN (
            SELECT id FROM warung WHERE owner_id = auth.uid()
        )
    ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_items_warung ON stock_items(warung_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_usage_product ON product_stock_usage(product_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_usage_stock ON product_stock_usage(stock_item_id);
