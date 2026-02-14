import { getUntypedSupabaseClient } from "@/lib/supabase/client"

interface DeductionResult {
    success: boolean
    /** Names of stock items that hit zero or had insufficient stock */
    insufficientItems: string[]
}

/**
 * Deducts stock items linked to a product when a sale is made.
 * Looks up product_stock_usage to find which stock_items to decrement.
 * 
 * @param productId - The product that was sold
 * @param quantity - Number of units sold (default: 1)
 * @returns Result indicating success and any insufficient stock items
 */
export async function deductStockForProduct(productId: string, quantity: number = 1): Promise<DeductionResult> {
    const supabase = getUntypedSupabaseClient()
    const insufficientItems: string[] = []

    try {
        // 1. Get all stock usage rules for this product
        const { data: usageRules, error: usageError } = await supabase
            .from("product_stock_usage")
            .select("stock_item_id, quantity_used")
            .eq("product_id", productId)

        if (usageError) {
            console.error("[Stock] Failed to fetch usage rules:", usageError)
            return { success: false, insufficientItems }
        }

        if (!usageRules || usageRules.length === 0) {
            // No stock items linked to this product, nothing to deduct
            return { success: true, insufficientItems }
        }

        // 2. For each linked stock item, decrement the quantity
        for (const rule of usageRules) {
            const totalDeduction = rule.quantity_used * quantity

            // Get current stock
            const { data: stockItem, error: fetchError } = await supabase
                .from("stock_items")
                .select("id, quantity, name")
                .eq("id", rule.stock_item_id)
                .single()

            if (fetchError || !stockItem) {
                console.error(`[Stock] Failed to fetch stock item ${rule.stock_item_id}:`, fetchError)
                continue
            }

            // Check if stock is sufficient
            if (stockItem.quantity < totalDeduction) {
                console.warn(`[Stock] Insufficient: ${stockItem.name} has ${stockItem.quantity} but needs ${totalDeduction}`)
                insufficientItems.push(stockItem.name)
            }

            const newQty = Math.max(0, stockItem.quantity - totalDeduction)

            const { error: updateError } = await supabase
                .from("stock_items")
                .update({
                    quantity: newQty,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", rule.stock_item_id)

            if (updateError) {
                console.error(`[Stock] Failed to update ${stockItem.name}:`, updateError)
            }
        }

        return { success: true, insufficientItems }
    } catch (err) {
        console.error("[Stock] Auto-deduction error:", err)
        return { success: false, insufficientItems }
    }
}

