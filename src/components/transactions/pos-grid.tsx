"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Plus, Minus, X } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export interface Product {
    id: string
    name: string
    price: number
    stock: number
    emoji?: string
    imageUrl?: string
    category?: string
}

interface POSGridProps {
    products: Product[]
    onAddToCart: (product: Product, qty: number) => void
    cartItems?: Map<string, number>
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function POSGrid({ products, onAddToCart, cartItems = new Map() }: POSGridProps) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [qty, setQty] = useState(1)

    const handleProductClick = (product: Product) => {
        if (product.stock === 0) return
        setSelectedProduct(product)
        setQty(1)
    }

    const handleConfirm = () => {
        if (selectedProduct && qty > 0) {
            onAddToCart(selectedProduct, qty)
            setSelectedProduct(null)
            setQty(1)
        }
    }

    const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
        e.stopPropagation()
        if (product.stock === 0) return
        onAddToCart(product, 1)
    }

    return (
        <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                {products.map((product) => {
                    const inCartQty = cartItems.get(product.id) || 0
                    const isOutOfStock = product.stock === 0
                    const isLowStock = product.stock > 0 && product.stock <= 5

                    return (
                        <button
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            disabled={isOutOfStock}
                            className={cn(
                                "relative flex flex-col items-center justify-center p-2 md:p-3 rounded-xl border-2 bg-card transition-all min-h-[90px] md:min-h-[110px] shadow-sm",
                                "hover:border-primary hover:shadow-md active:scale-95",
                                inCartQty > 0 ? "border-primary bg-primary/5" : "border-transparent",
                                isOutOfStock && "opacity-50 cursor-not-allowed hover:border-transparent hover:shadow-sm"
                            )}
                        >
                            {/* Cart Badge */}
                            {inCartQty > 0 && (
                                <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 justify-center bg-primary text-primary-foreground z-10">
                                    {inCartQty}
                                </Badge>
                            )}

                            {/* Low Stock Badge */}
                            {isLowStock && (
                                <Badge
                                    variant="destructive"
                                    className="absolute top-1 left-1 text-[10px] px-1 py-0"
                                >
                                    Sisa {product.stock}
                                </Badge>
                            )}

                            {/* Product Icon/Image */}
                            <span className="text-2xl md:text-3xl mb-1 md:mb-2">
                                {product.emoji || "📦"}
                            </span>

                            {/* Product Name */}
                            <span className="text-xs md:text-sm font-medium text-center line-clamp-2">
                                {product.name}
                            </span>

                            {/* Price */}
                            <span className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                                {formatRupiah(product.price)}
                            </span>

                            {/* Quick Add Button (desktop) */}
                            <Button
                                size="icon"
                                variant="secondary"
                                className="absolute bottom-1 right-1 h-6 w-6 md:h-7 md:w-7 opacity-0 group-hover:opacity-100 hidden md:flex"
                                onClick={(e) => handleQuickAdd(product, e)}
                                disabled={isOutOfStock}
                            >
                                <Plus className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                        </button>
                    )
                })}
            </div>

            {/* Quantity Dialog */}
            <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle className="text-center">
                            {selectedProduct?.emoji} {selectedProduct?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <p className="text-center text-lg font-semibold text-primary">
                            {selectedProduct && formatRupiah(selectedProduct.price)}
                        </p>

                        {/* Quantity Selector */}
                        <div className="flex items-center justify-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 rounded-full"
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                            >
                                <Minus className="h-5 w-5" />
                            </Button>

                            <span className="text-3xl font-bold tabular-nums w-16 text-center">
                                {qty}
                            </span>

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 rounded-full"
                                onClick={() =>
                                    setQty((q) => Math.min(selectedProduct?.stock || 99, q + 1))
                                }
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Stock Info */}
                        <p className="text-center text-sm text-muted-foreground">
                            Stok tersedia: {selectedProduct?.stock}
                        </p>

                        {/* Total */}
                        <div className="text-center py-2 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground">Total: </span>
                            <span className="text-lg font-bold text-income">
                                {selectedProduct && formatRupiah(selectedProduct.price * qty)}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setSelectedProduct(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                className="flex-1 bg-primary hover:bg-primary/90"
                                onClick={handleConfirm}
                            >
                                Tambah
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
