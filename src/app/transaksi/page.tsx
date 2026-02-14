"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { AdaptiveShell, Header } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth/auth-context"
import { getUntypedSupabaseClient } from "@/lib/supabase/client"
import { Plus, Minus, ShoppingCart, Trash2, Package, Loader2, CreditCard, Banknote } from "lucide-react"
import { cn } from "@/lib/utils"

interface Product {
    id: string
    name: string
    sell_price: number
    buy_price: number
    stock: number
    emoji?: string | null
    image_url?: string | null
}

interface CartItem {
    productId: string
    name: string
    price: number
    buyPrice: number
    qty: number
}

type PaymentMethod = "cash" | "qris"

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export default function TransaksiPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [cart, setCart] = useState<CartItem[]>([])
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")

    const { warung, user, isLoading: authLoading } = useAuth()
    const supabase = getUntypedSupabaseClient()

    const fetchProducts = useCallback(async () => {
        if (!warung?.id) return

        setIsLoading(true)

        try {
            const { data, error } = await supabase
                .from("products")
                .select("id, name, sell_price, buy_price, stock, emoji, image_url")
                .eq("warung_id", warung.id)
                .eq("is_active", true)
                .gt("sell_price", 0) // Only products with sell price
                .order("name")

            if (error) throw error

            setProducts((data as Product[]) || [])
        } catch (err) {
            console.error("Error fetching products:", err)
        } finally {
            setIsLoading(false)
        }
    }, [warung?.id, supabase])

    useEffect(() => {
        if (warung?.id) {
            fetchProducts()
        } else if (!authLoading) {
            // Auth done but no warung (handled by RequireAuth usually, but safe to stop loading)
            setIsLoading(false)
        }
    }, [fetchProducts, warung, authLoading])

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.productId === product.id)
            if (existing) {
                return prev.map((item) =>
                    item.productId === product.id
                        ? { ...item, qty: item.qty + 1 }
                        : item
                )
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                price: product.sell_price,
                buyPrice: product.buy_price,
                qty: 1
            }]
        })
    }

    const updateQty = (productId: string, delta: number) => {
        setCart((prev) => {
            return prev
                .map((item) =>
                    item.productId === productId
                        ? { ...item, qty: Math.max(0, item.qty + delta) }
                        : item
                )
                .filter((item) => item.qty > 0)
        })
    }

    const clearCart = () => {
        setCart([])
        setPaymentMethod("cash") // Reset to default
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
    const itemCount = cart.reduce((sum, item) => sum + item.qty, 0)
    const totalProfit = cart.reduce((sum, item) => sum + (item.price - item.buyPrice) * item.qty, 0)

    const handleCheckout = async () => {
        if (!warung || !user || cart.length === 0) return

        setIsCheckingOut(true)

        try {
            // Create transaction for each cart item
            // AND record payment method
            const transactions = cart.map(item => ({
                warung_id: warung.id,
                type: "income",
                amount: item.price * item.qty,
                product_id: item.productId,
                quantity: item.qty,
                category: "Penjualan",
                note: item.name,
                created_by: user.id,
                payment_method: paymentMethod, // Add payment method
            }))

            const { error: txError } = await supabase
                .from("transactions")
                .insert(transactions)

            if (txError) throw txError

            // Note: We don't update stock anymore as requested (simplified mode)
            alert(`Total: ${formatRupiah(total)}\nMetode: ${paymentMethod.toUpperCase()}\n\nTransaksi berhasil disimpan!`)
            clearCart()
        } catch (err) {
            console.error("Checkout error:", err)
            alert("Gagal menyimpan transaksi. Coba lagi.")
        } finally {
            setIsCheckingOut(false)
        }
    }

    if (isLoading) {
        return (
            <AdaptiveShell>
                <Header title="Input Penjualan" showBack />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdaptiveShell>
        )
    }

    return (
        <AdaptiveShell>
            <Header title="Input Penjualan" subtitle="Tap produk untuk menambah" showBack />

            <div className="flex flex-col md:flex-row md:h-[calc(100vh-4rem)]">
                {/* Product Grid */}
                <div className="flex-1 p-4 overflow-auto">
                    {products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="font-medium">Belum ada produk</p>
                            <p className="text-muted-foreground text-sm mt-1">
                                Tambah produk dulu di menu Stok
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {products.map((product) => {
                                const inCart = cart.find((item) => item.productId === product.id)

                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center p-3 rounded-xl border-2 bg-card transition-all min-h-[100px] shadow-sm",
                                            "hover:border-primary hover:shadow-md active:scale-95",
                                            inCart ? "border-primary bg-primary/5" : "border-transparent"
                                        )}
                                    >
                                        {inCart && (
                                            <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 justify-center bg-primary text-primary-foreground">
                                                {inCart.qty}
                                            </Badge>
                                        )}

                                        {/* Product Image */}
                                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-2 overflow-hidden">
                                            {product.image_url ? (
                                                <Image
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    width={48}
                                                    height={48}
                                                    className="w-full h-full object-cover"
                                                    unoptimized
                                                />
                                            ) : product.emoji ? (
                                                <span className="text-2xl">{product.emoji}</span>
                                            ) : (
                                                <Package className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>

                                        <span className="text-sm font-medium text-center line-clamp-2">
                                            {product.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-1">
                                            {formatRupiah(product.sell_price)}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Cart Panel */}
                <div className="md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-border bg-card">
                    <div className="flex flex-col h-full">
                        {/* Cart Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                                <span className="font-semibold">Keranjang</span>
                                {itemCount > 0 && (
                                    <Badge variant="secondary">{itemCount} item</Badge>
                                )}
                            </div>
                            {cart.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={clearCart}>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Hapus
                                </Button>
                            )}
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-auto p-4 space-y-3">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">Keranjang kosong</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Tap produk untuk menambahkan
                                    </p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <Card key={item.productId} className="overflow-hidden">
                                        <CardContent className="p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatRupiah(item.price)} × {item.qty}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => updateQty(item.productId, -1)}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="w-8 text-center font-medium tabular-nums">
                                                        {item.qty}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => updateQty(item.productId, 1)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>

                        {/* Cart Footer */}
                        {cart.length > 0 && (
                            <div className="p-4 border-t border-border space-y-4 bg-muted/30">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Total</span>
                                        <span className="text-2xl font-bold text-income tabular-nums">
                                            {formatRupiah(total)}
                                        </span>
                                    </div>
                                </div>

                                {/* Payment Method Selection */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div
                                        onClick={() => setPaymentMethod("cash")}
                                        className={cn(
                                            "cursor-pointer flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                                            paymentMethod === "cash"
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border hover:bg-muted"
                                        )}
                                    >
                                        <Banknote className="h-5 w-5" />
                                        <span className="font-medium text-sm">Tunai</span>
                                    </div>
                                    <div
                                        onClick={() => setPaymentMethod("qris")}
                                        className={cn(
                                            "cursor-pointer flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                                            paymentMethod === "qris"
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border hover:bg-muted"
                                        )}
                                    >
                                        <CreditCard className="h-5 w-5" />
                                        <span className="font-medium text-sm">QRIS</span>
                                    </div>
                                </div>

                                <Button
                                    size="lg"
                                    className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
                                    onClick={handleCheckout}
                                    disabled={isCheckingOut}
                                >
                                    {isCheckingOut ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        "Bayar Sekarang"
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdaptiveShell>
    )
}
