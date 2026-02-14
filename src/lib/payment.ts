// Payment Integration Types and Utilities
// For Midtrans/Xendit webhook handling

export interface PaymentWebhookPayload {
    order_id: string
    transaction_status: "capture" | "settlement" | "pending" | "deny" | "cancel" | "expire" | "failure"
    gross_amount: string
    payment_type: string
    transaction_time: string
    transaction_id: string
    signature_key?: string
}

export interface CreatePaymentParams {
    orderId: string
    amount: number
    customerName: string
    customerEmail?: string
    customerPhone?: string
    itemDetails?: Array<{
        id: string
        name: string
        price: number
        quantity: number
    }>
}

export interface PaymentResult {
    success: boolean
    transactionId?: string
    redirectUrl?: string
    qrisCode?: string
    error?: string
}

/**
 * Verify Midtrans signature
 * signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export async function verifyMidtransSignature(
    payload: PaymentWebhookPayload,
    serverKey: string
): Promise<boolean> {
    const { order_id, transaction_status, gross_amount, signature_key } = payload

    if (!signature_key) return false

    // Map transaction_status to status_code
    const statusCodeMap: Record<string, string> = {
        capture: "200",
        settlement: "200",
        pending: "201",
        deny: "202",
        cancel: "202",
        expire: "202",
        failure: "202",
    }
    const statusCode = statusCodeMap[transaction_status] || "200"

    const data = `${order_id}${statusCode}${gross_amount}${serverKey}`

    // Create SHA512 hash
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest("SHA-512", dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

    return hashHex === signature_key
}

/**
 * Generate unique order ID
 */
export function generateOrderId(prefix = "DC"): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}-${timestamp}-${random}`
}

/**
 * Format payment status for display
 */
export function formatPaymentStatus(status: PaymentWebhookPayload["transaction_status"]): {
    label: string
    variant: "success" | "warning" | "error" | "default"
} {
    switch (status) {
        case "capture":
        case "settlement":
            return { label: "Berhasil", variant: "success" }
        case "pending":
            return { label: "Menunggu Pembayaran", variant: "warning" }
        case "deny":
        case "cancel":
            return { label: "Dibatalkan", variant: "error" }
        case "expire":
            return { label: "Kedaluwarsa", variant: "error" }
        case "failure":
            return { label: "Gagal", variant: "error" }
        default:
            return { label: status, variant: "default" }
    }
}

// Example Midtrans integration (requires backend API route)
// This would be called from an API route, not client-side
/*
export async function createMidtransTransaction(params: CreatePaymentParams): Promise<PaymentResult> {
  const response = await fetch("/api/payment/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  
  if (!response.ok) {
    return { success: false, error: "Failed to create payment" }
  }
  
  return response.json()
}
*/
