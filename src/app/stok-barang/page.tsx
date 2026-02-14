"use client"

import { useState, useEffect, useCallback } from "react"
import { AdaptiveShell, Header, FAB } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth/auth-context"
import { getUntypedSupabaseClient } from "@/lib/supabase/client"
import {
    Search,
    Plus,
    Boxes,
    AlertTriangle,
    Edit,
    Trash2,
    Loader2,
    X,
    PackagePlus,
    Link2,
    Package,
    ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StockItem {
    id: string
    name: string
    quantity: number
    unit: string
    min_stock: number
    is_active: boolean
    created_at: string
}

interface ProductSimple {
    id: string
    name: string
    sell_price: number
    emoji?: string | null
}

interface UsageRule {
    id: string
    product_id: string
    stock_item_id: string
    quantity_used: number
    stock_item?: { name: string; unit: string }
}

type ActiveTab = "stock" | "usage"

export default function StokBarangPage() {
    const [activeTab, setActiveTab] = useState<ActiveTab>("stock")
    const [items, setItems] = useState<StockItem[]>([])
    const [products, setProducts] = useState<ProductSimple[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState<"all" | "low">("all")
    const [showForm, setShowForm] = useState(false)
    const [editItem, setEditItem] = useState<StockItem | null>(null)

    // Form states
    const [formName, setFormName] = useState("")
    const [formQty, setFormQty] = useState("")
    const [formUnit, setFormUnit] = useState("pcs")
    const [formMinStock, setFormMinStock] = useState("10")
    const [formSaving, setFormSaving] = useState(false)

    // Restock states
    const [restockItemId, setRestockItemId] = useState<string | null>(null)
    const [restockQty, setRestockQty] = useState("")

    // Usage linking states
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
    const [usageRules, setUsageRules] = useState<UsageRule[]>([])
    const [usageLoading, setUsageLoading] = useState(false)
    const [showAddUsage, setShowAddUsage] = useState(false)
    const [newUsageStockId, setNewUsageStockId] = useState("")
    const [newUsageQty, setNewUsageQty] = useState("1")

    const { warung, isLoading: authLoading } = useAuth()
    const supabase = getUntypedSupabaseClient()

    // ===== FETCH DATA =====
    const fetchItems = useCallback(async () => {
        if (!warung?.id) return
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from("stock_items")
                .select("*")
                .eq("warung_id", warung.id)
                .eq("is_active", true)
                .order("name")
            if (error) throw error
            setItems((data as StockItem[]) || [])
        } catch (err) {
            console.error("Error fetching stock items:", err)
        } finally {
            setIsLoading(false)
        }
    }, [warung?.id, supabase])

    const fetchProducts = useCallback(async () => {
        if (!warung?.id) return
        try {
            const { data, error } = await supabase
                .from("products")
                .select("id, name, sell_price, emoji")
                .eq("warung_id", warung.id)
                .eq("is_active", true)
                .order("name")
            if (error) throw error
            setProducts((data as ProductSimple[]) || [])
        } catch (err) {
            console.error("Error fetching products:", err)
        }
    }, [warung?.id, supabase])

    const fetchUsageRules = useCallback(async (productId: string) => {
        setUsageLoading(true)
        try {
            const { data, error } = await supabase
                .from("product_stock_usage")
                .select("id, product_id, stock_item_id, quantity_used, stock_item:stock_items(name, unit)")
                .eq("product_id", productId)

            if (error) throw error
            setUsageRules((data as any[]) || [])
        } catch (err) {
            console.error("Error fetching usage rules:", err)
            setUsageRules([])
        } finally {
            setUsageLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        if (warung?.id) {
            fetchItems()
            fetchProducts()
        } else if (!authLoading) {
            setIsLoading(false)
        }
    }, [fetchItems, fetchProducts, warung, authLoading])

    useEffect(() => {
        if (selectedProductId) {
            fetchUsageRules(selectedProductId)
        }
    }, [selectedProductId, fetchUsageRules])

    // ===== STOCK ITEM CRUD =====
    const resetForm = () => {
        setFormName("")
        setFormQty("")
        setFormUnit("pcs")
        setFormMinStock("10")
        setEditItem(null)
    }

    const openAddForm = () => {
        resetForm()
        setShowForm(true)
    }

    const openEditForm = (item: StockItem) => {
        setEditItem(item)
        setFormName(item.name)
        setFormQty(String(item.quantity))
        setFormUnit(item.unit)
        setFormMinStock(String(item.min_stock))
        setShowForm(true)
    }

    const handleSave = async () => {
        if (!warung?.id || !formName.trim()) return
        setFormSaving(true)
        try {
            if (editItem) {
                const { error } = await supabase
                    .from("stock_items")
                    .update({
                        name: formName.trim(),
                        quantity: parseInt(formQty) || 0,
                        unit: formUnit,
                        min_stock: parseInt(formMinStock) || 10,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", editItem.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from("stock_items")
                    .insert({
                        warung_id: warung.id,
                        name: formName.trim(),
                        quantity: parseInt(formQty) || 0,
                        unit: formUnit,
                        min_stock: parseInt(formMinStock) || 10,
                    })
                if (error) throw error
            }
            setShowForm(false)
            resetForm()
            fetchItems()
        } catch (err) {
            console.error("Save error:", err)
            alert("Gagal menyimpan stok barang")
        } finally {
            setFormSaving(false)
        }
    }

    const handleDelete = async (item: StockItem) => {
        if (!confirm(`Hapus "${item.name}" dari daftar stok?`)) return
        try {
            const { error } = await supabase
                .from("stock_items")
                .update({ is_active: false })
                .eq("id", item.id)
            if (error) throw error
            setItems(prev => prev.filter(i => i.id !== item.id))
        } catch (err) {
            console.error("Delete error:", err)
            alert("Gagal menghapus barang")
        }
    }

    const handleRestock = async (itemId: string) => {
        const qty = parseInt(restockQty)
        if (!qty || qty <= 0) return
        try {
            const item = items.find(i => i.id === itemId)
            if (!item) return
            const { error } = await supabase
                .from("stock_items")
                .update({
                    quantity: item.quantity + qty,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", itemId)
            if (error) throw error
            setRestockItemId(null)
            setRestockQty("")
            fetchItems()
        } catch (err) {
            console.error("Restock error:", err)
            alert("Gagal menambah stok")
        }
    }

    // ===== USAGE RULE CRUD =====
    const handleAddUsageRule = async () => {
        if (!selectedProductId || !newUsageStockId) return
        try {
            const { error } = await supabase
                .from("product_stock_usage")
                .insert({
                    product_id: selectedProductId,
                    stock_item_id: newUsageStockId,
                    quantity_used: parseInt(newUsageQty) || 1,
                })
            if (error) {
                if (error.code === '23505') {
                    alert("Barang ini sudah ditambahkan ke produk ini")
                    return
                }
                throw error
            }
            setShowAddUsage(false)
            setNewUsageStockId("")
            setNewUsageQty("1")
            fetchUsageRules(selectedProductId)
        } catch (err) {
            console.error("Add usage rule error:", err)
            alert("Gagal menambah aturan pemakaian")
        }
    }

    const handleDeleteUsageRule = async (ruleId: string) => {
        if (!selectedProductId) return
        try {
            const { error } = await supabase
                .from("product_stock_usage")
                .delete()
                .eq("id", ruleId)
            if (error) throw error
            fetchUsageRules(selectedProductId)
        } catch (err) {
            console.error("Delete usage rule error:", err)
            alert("Gagal menghapus aturan")
        }
    }

    const handleUpdateUsageQty = async (ruleId: string, newQty: number) => {
        if (!selectedProductId || newQty < 1) return
        try {
            const { error } = await supabase
                .from("product_stock_usage")
                .update({ quantity_used: newQty })
                .eq("id", ruleId)
            if (error) throw error
            fetchUsageRules(selectedProductId)
        } catch (err) {
            console.error("Update usage qty error:", err)
        }
    }

    // ===== FILTERS =====
    const filteredItems = items.filter((item) => {
        if (filter === "low" && item.quantity > item.min_stock) return false
        if (search) {
            return item.name.toLowerCase().includes(search.toLowerCase())
        }
        return true
    })

    const lowStockCount = items.filter(i => i.quantity <= i.min_stock).length

    // ===== RENDER =====
    if (isLoading) {
        return (
            <AdaptiveShell>
                <Header title="Stok Barang" />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdaptiveShell>
        )
    }

    return (
        <AdaptiveShell>
            <Header title="Stok Barang" subtitle={`${items.length} barang tercatat`} />

            <div className="p-4 md:p-6 space-y-4">
                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
                    <TabsList>
                        <TabsTrigger value="stock" className="gap-1.5">
                            <Boxes className="h-4 w-4" />
                            Daftar Stok
                        </TabsTrigger>
                        <TabsTrigger value="usage" className="gap-1.5">
                            <Link2 className="h-4 w-4" />
                            Pemakaian Produk
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* ===== TAB: STOCK LIST ===== */}
                {activeTab === "stock" && (
                    <>
                        {/* Search & Filter */}
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari barang..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            {lowStockCount > 0 && (
                                <Button
                                    variant={filter === "low" ? "default" : "outline"}
                                    size="sm"
                                    className="gap-1.5 shrink-0"
                                    onClick={() => setFilter(filter === "low" ? "all" : "low")}
                                >
                                    <AlertTriangle className="h-4 w-4" />
                                    {lowStockCount} Menipis
                                </Button>
                            )}
                        </div>

                        {/* Stock Items Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredItems.map((item) => {
                                const isLow = item.quantity <= item.min_stock
                                const isRestocking = restockItemId === item.id
                                return (
                                    <Card key={item.id} className="card-hover">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "flex items-center justify-center w-12 h-12 rounded-xl shrink-0",
                                                    isLow ? "bg-destructive/10" : "bg-primary/10"
                                                )}>
                                                    <Boxes className={cn("h-6 w-6", isLow ? "text-destructive" : "text-primary")} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="font-semibold truncate">{item.name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={cn("text-lg font-bold tabular-nums", isLow ? "text-destructive" : "text-foreground")}>
                                                                    {item.quantity}
                                                                </span>
                                                                <span className="text-sm text-muted-foreground">{item.unit}</span>
                                                                {isLow && (
                                                                    <Badge variant="destructive" className="text-xs">
                                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                                        Menipis
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                Min stok: {item.min_stock} {item.unit}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1 shrink-0">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Tambah Stok"
                                                                onClick={() => { setRestockItemId(isRestocking ? null : item.id); setRestockQty("") }}>
                                                                <PackagePlus className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditForm(item)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    {isRestocking && (
                                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                                            <Input type="number" placeholder="Jumlah" value={restockQty}
                                                                onChange={(e) => setRestockQty(e.target.value)} className="h-9 w-24" min={1} autoFocus />
                                                            <span className="text-sm text-muted-foreground">{item.unit}</span>
                                                            <Button size="sm" className="h-9" onClick={() => handleRestock(item.id)}
                                                                disabled={!restockQty || parseInt(restockQty) <= 0}>Tambah</Button>
                                                            <Button size="sm" variant="ghost" className="h-9"
                                                                onClick={() => { setRestockItemId(null); setRestockQty("") }}>Batal</Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>

                        {filteredItems.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <Boxes className="h-8 w-8 text-muted-foreground" />
                                </div>
                                {items.length === 0 ? (
                                    <>
                                        <p className="font-medium">Belum ada stok barang</p>
                                        <p className="text-muted-foreground text-sm mt-1">
                                            Tap tombol + untuk menambahkan barang seperti sedotan, cup, atau plastik
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground">Tidak ada barang ditemukan</p>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ===== TAB: PRODUCT USAGE LINKING ===== */}
                {activeTab === "usage" && (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Atur Pemakaian Stok per Produk</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Pilih produk lalu tentukan barang apa saja yang dipakai per penjualan. Stok akan otomatis berkurang saat ada transaksi.
                                </p>
                            </CardHeader>
                            <CardContent>
                                {/* Product Selector */}
                                <div className="space-y-2">
                                    <Label>Pilih Produk</Label>
                                    <div className="relative">
                                        <select
                                            value={selectedProductId || ""}
                                            onChange={(e) => {
                                                setSelectedProductId(e.target.value || null)
                                                setShowAddUsage(false)
                                            }}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none pr-10"
                                        >
                                            <option value="">-- Pilih produk --</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.emoji ? `${p.emoji} ` : ""}{p.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Usage Rules for Selected Product */}
                        {selectedProductId && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-5 w-5 text-primary" />
                                            <CardTitle className="text-base">
                                                {products.find(p => p.id === selectedProductId)?.emoji}{" "}
                                                {products.find(p => p.id === selectedProductId)?.name}
                                            </CardTitle>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="gap-1.5"
                                            onClick={() => setShowAddUsage(true)}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Tambah Barang
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Barang yang dipakai setiap 1x penjualan:
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {usageLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : usageRules.length === 0 && !showAddUsage ? (
                                        <div className="text-center py-8">
                                            <Link2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                            <p className="text-sm font-medium">Belum ada barang yang di-link</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Klik &quot;Tambah Barang&quot; untuk menentukan stok apa saja yang dipakai per penjualan
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {usageRules.map(rule => {
                                                const stockItem = items.find(i => i.id === rule.stock_item_id)
                                                const stockName = (rule.stock_item as any)?.name || stockItem?.name || "?"
                                                const stockUnit = (rule.stock_item as any)?.unit || stockItem?.unit || "pcs"

                                                return (
                                                    <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                                                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                                                            <Boxes className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium truncate">{stockName}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Stok saat ini: {stockItem?.quantity ?? "?"} {stockUnit}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button
                                                                className="w-7 h-7 rounded border flex items-center justify-center text-sm hover:bg-muted transition-colors"
                                                                onClick={() => handleUpdateUsageQty(rule.id, rule.quantity_used - 1)}
                                                                disabled={rule.quantity_used <= 1}
                                                            >−</button>
                                                            <span className="w-8 text-center font-bold tabular-nums">{rule.quantity_used}</span>
                                                            <button
                                                                className="w-7 h-7 rounded border flex items-center justify-center text-sm hover:bg-muted transition-colors"
                                                                onClick={() => handleUpdateUsageQty(rule.id, rule.quantity_used + 1)}
                                                            >+</button>
                                                            <span className="text-xs text-muted-foreground ml-1">{stockUnit}</span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive shrink-0"
                                                            onClick={() => handleDeleteUsageRule(rule.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* Add Usage Rule Inline Form */}
                                    {showAddUsage && (
                                        <div className="mt-4 p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
                                            <p className="text-sm font-medium">Tambah barang yang dipakai:</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="sm:col-span-2">
                                                    <Label className="text-xs">Barang Stok</Label>
                                                    <div className="relative mt-1">
                                                        <select
                                                            value={newUsageStockId}
                                                            onChange={(e) => setNewUsageStockId(e.target.value)}
                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none pr-10"
                                                        >
                                                            <option value="">Pilih barang...</option>
                                                            {items
                                                                .filter(i => !usageRules.some(r => r.stock_item_id === i.id))
                                                                .map(i => (
                                                                    <option key={i.id} value={i.id}>
                                                                        {i.name} ({i.quantity} {i.unit})
                                                                    </option>
                                                                ))
                                                            }
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Jumlah per penjualan</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={newUsageQty}
                                                        onChange={(e) => setNewUsageQty(e.target.value)}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={handleAddUsageRule}
                                                    disabled={!newUsageStockId}
                                                    className="gap-1.5"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Simpan
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setShowAddUsage(false)
                                                        setNewUsageStockId("")
                                                        setNewUsageQty("1")
                                                    }}
                                                >
                                                    Batal
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Products overview (when no product selected) */}
                        {!selectedProductId && products.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Daftar Produk</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Pilih produk di atas untuk mengatur barang apa saja yang dipakai per penjualan.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {products.map(p => (
                                            <button
                                                key={p.id}
                                                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                                                onClick={() => setSelectedProductId(p.id)}
                                            >
                                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary shrink-0">
                                                    {p.emoji ? (
                                                        <span className="text-lg">{p.emoji}</span>
                                                    ) : (
                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{p.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Rp {p.sell_price.toLocaleString("id-ID")}
                                                    </p>
                                                </div>
                                                <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {products.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Package className="h-10 w-10 text-muted-foreground mb-3" />
                                <p className="font-medium">Belum ada produk</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Tambahkan produk terlebih dahulu di halaman Produk
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* FAB only on stock tab */}
            {activeTab === "stock" && (
                <FAB
                    icon={<Plus className="h-6 w-6" />}
                    label="Tambah Barang"
                    onClick={openAddForm}
                />
            )}

            {/* Add/Edit Stock Item Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-md mx-auto glass">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">
                                    {editItem ? "Edit Barang" : "Tambah Barang Baru"}
                                </h2>
                                <Button variant="ghost" size="icon" className="h-8 w-8"
                                    onClick={() => { setShowForm(false); resetForm() }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="name">Nama Barang</Label>
                                    <Input id="name" placeholder="contoh: Sedotan, Cup, Plastik"
                                        value={formName} onChange={(e) => setFormName(e.target.value)} className="mt-1" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="qty">Jumlah Stok</Label>
                                        <Input id="qty" type="number" placeholder="250"
                                            value={formQty} onChange={(e) => setFormQty(e.target.value)} className="mt-1" min={0} />
                                    </div>
                                    <div>
                                        <Label htmlFor="unit">Satuan</Label>
                                        <select id="unit" value={formUnit} onChange={(e) => setFormUnit(e.target.value)}
                                            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                            <option value="pcs">pcs</option>
                                            <option value="pack">pack</option>
                                            <option value="box">box</option>
                                            <option value="kg">kg</option>
                                            <option value="liter">liter</option>
                                            <option value="roll">roll</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="minStock">Minimum Stok (Alert)</Label>
                                    <Input id="minStock" type="number" placeholder="10"
                                        value={formMinStock} onChange={(e) => setFormMinStock(e.target.value)} className="mt-1" min={0} />
                                    <p className="text-xs text-muted-foreground mt-1">Akan muncul warning jika stok di bawah angka ini</p>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" className="flex-1"
                                    onClick={() => { setShowForm(false); resetForm() }}>Batal</Button>
                                <Button className="flex-1 btn-gradient" onClick={handleSave}
                                    disabled={formSaving || !formName.trim()}>
                                    {formSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>)
                                        : (editItem ? "Simpan Perubahan" : "Tambah Barang")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </AdaptiveShell>
    )
}
