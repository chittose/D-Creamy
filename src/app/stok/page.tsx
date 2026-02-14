"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { AdaptiveShell, Header, FAB } from "@/components/layout"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductForm } from "@/components/products"
import { useAuth } from "@/lib/auth/auth-context"
import { getUntypedSupabaseClient } from "@/lib/supabase/client"
import {
    Search,
    Plus,
    Package,
    AlertTriangle,
    Edit,
    Trash2,
    Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Product {
    id: string
    name: string
    buy_price: number
    sell_price: number
    stock: number
    category: string
    emoji?: string | null
    image_url?: string | null
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export default function StokPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState<"all" | "low">("all")
    const [showForm, setShowForm] = useState(false)
    const [editProduct, setEditProduct] = useState<Product | null>(null)

    const { warung, isLoading: authLoading } = useAuth()
    const supabase = getUntypedSupabaseClient()

    const fetchProducts = useCallback(async () => {
        if (!warung?.id) return

        setIsLoading(true)

        try {
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("warung_id", warung.id)
                .eq("is_active", true)
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
            setIsLoading(false)
        }
    }, [fetchProducts, warung, authLoading])

    const handleDelete = async (product: Product) => {
        if (!confirm(`Hapus produk "${product.name}"?`)) return

        try {
            const { error } = await supabase
                .from("products")
                .update({ is_active: false })
                .eq("id", product.id)

            if (error) throw error

            setProducts(prev => prev.filter(p => p.id !== product.id))
        } catch (err) {
            console.error("Delete error:", err)
            alert("Gagal menghapus produk")
        }
    }

    const filteredProducts = products.filter((p) => {
        if (filter === "low" && p.stock > 10) return false
        if (search) {
            return p.name.toLowerCase().includes(search.toLowerCase())
        }
        return true
    })

    const lowStockCount = products.filter(p => p.stock <= 10).length

    if (isLoading) {
        return (
            <AdaptiveShell>
                <Header title="Produk & Stok" />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdaptiveShell>
        )
    }

    return (
        <AdaptiveShell>
            <Header title="Daftar Produk" subtitle={`${products.length} produk tersimpan`} />

            <div className="p-4 md:p-6 space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari produk..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => {
                        return (
                            <Card key={product.id} className="card-hover">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        {/* Product Image */}
                                        <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0">
                                            {product.image_url ? (
                                                <Image
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    width={64}
                                                    height={64}
                                                    className="w-full h-full object-cover"
                                                    unoptimized
                                                />
                                            ) : product.emoji ? (
                                                <span className="text-2xl">{product.emoji}</span>
                                            ) : (
                                                <Package className="h-6 w-6 text-muted-foreground" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold truncate">{product.name}</p>
                                                    <Badge variant="secondary" className="text-xs mt-1">
                                                        {product.category}
                                                    </Badge>
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => {
                                                            setEditProduct(product)
                                                            setShowForm(true)
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        onClick={() => handleDelete(product)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="text-sm">
                                                    <span className="text-muted-foreground">Harga:</span>
                                                    <span className="ml-1 font-semibold text-income">
                                                        {formatRupiah(product.sell_price)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* Empty State */}
                {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                        {products.length === 0 ? (
                            <>
                                <p className="font-medium">Belum ada produk</p>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Tap tombol + untuk menambahkan produk pertama
                                </p>
                            </>
                        ) : (
                            <p className="text-muted-foreground">Tidak ada produk ditemukan</p>
                        )}
                    </div>
                )}
            </div>

            {/* Add Product FAB */}
            <FAB
                icon={<Plus className="h-6 w-6" />}
                label="Tambah Produk"
                onClick={() => {
                    setEditProduct(null)
                    setShowForm(true)
                }}
            />

            {/* Product Form Modal */}
            <ProductForm
                open={showForm}
                onClose={() => {
                    setShowForm(false)
                    setEditProduct(null)
                }}
                onSuccess={fetchProducts}
                warungId={warung?.id || ""}
                editProduct={editProduct || undefined}
            />
        </AdaptiveShell>
    )
}
