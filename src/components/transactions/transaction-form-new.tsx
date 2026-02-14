"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { getUntypedSupabaseClient } from "@/lib/supabase/client"
import { deductStockForProduct } from "@/lib/stock-deduction"
import { cn } from "@/lib/utils"

interface TransactionFormProps {
    open: boolean
    onClose: () => void
    onSuccess?: () => void
    warungId: string
    userId: string
}

const incomeCategories = [
    "Penjualan",
    "Piutang Lunas",
    "Lainnya",
]

const expenseCategories = [
    "Bahan Baku",
    "Operasional",
    "Gaji Karyawan",
    "Listrik & Air",
    "Sewa",
    "Perlengkapan",
    "Transport",
    "Lainnya",
]

export function TransactionForm({
    open,
    onClose,
    onSuccess,
    warungId,
    userId,
}: TransactionFormProps) {
    const [type, setType] = useState<"income" | "expense">("income")
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris">("cash")
    const [amount, setAmount] = useState("")
    const [category, setCategory] = useState("")
    const [note, setNote] = useState("")
    const [productId, setProductId] = useState<string | null>(null)
    const [products, setProducts] = useState<{ id: string; name: string; sell_price: number }[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const supabase = getUntypedSupabaseClient()

    // Fetch products for income type
    useEffect(() => {
        if (type === "income" && open) {
            fetchProducts()
        }
    }, [type, open])

    const fetchProducts = async () => {
        const { data } = await supabase
            .from("products")
            .select("id, name, sell_price")
            .eq("warung_id", warungId)
            .eq("is_active", true)
            .gt("sell_price", 0)
            .order("name")

        setProducts(data || [])
    }

    const formatNumber = (value: string) => {
        const num = value.replace(/\D/g, "")
        if (!num) return ""
        return new Intl.NumberFormat("id-ID").format(parseInt(num, 10))
    }

    const handleProductSelect = (id: string) => {
        setProductId(id)
        const product = products.find(p => p.id === id)
        if (product) {
            setAmount(product.sell_price.toString())
            setNote(product.name)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || !category) return

        setError("")
        setIsLoading(true)

        try {
            const transactionData = {
                warung_id: warungId,
                type,
                amount: parseInt(amount.replace(/\D/g, ""), 10),
                category,
                note: note || null,
                product_id: type === "income" ? productId : null,
                quantity: 1,
                created_by: userId,
                payment_method: type === "income" ? paymentMethod : "cash",
            }

            const { error: txError } = await supabase
                .from("transactions")
                .insert(transactionData)

            if (txError) throw txError

            // Auto-deduct stock items if this is an income (sale) with a product
            if (type === "income" && productId) {
                await deductStockForProduct(productId, 1)
            }

            onSuccess?.()
            handleClose()
        } catch (err) {
            console.error("Save error:", err)
            setError("Gagal menyimpan transaksi. Coba lagi.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setType("income")
        setPaymentMethod("cash")
        setAmount("")
        setCategory("")
        setNote("")
        setProductId(null)
        setError("")
        onClose()
    }

    const categories = type === "income" ? incomeCategories : expenseCategories

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Tambah Transaksi</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Type Toggle */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setType("income")
                                setCategory("")
                            }}
                            className={cn(
                                "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                                type === "income"
                                    ? "border-income bg-income/10 text-income"
                                    : "border-border hover:border-income/50"
                            )}
                        >
                            <TrendingUp className="h-5 w-5" />
                            <span className="font-medium">Pemasukan</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setType("expense")
                                setCategory("")
                                setProductId(null)
                            }}
                            className={cn(
                                "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                                type === "expense"
                                    ? "border-expense bg-expense/10 text-expense"
                                    : "border-border hover:border-expense/50"
                            )}
                        >
                            <TrendingDown className="h-5 w-5" />
                            <span className="font-medium">Pengeluaran</span>
                        </button>
                    </div>

                    {/* Product Select (for income) */}
                    {type === "income" && products.length > 0 && (
                        <div className="space-y-2">
                            <Label>Produk (opsional)</Label>
                            <Select value={productId || ""} onValueChange={handleProductSelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih produk..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                            {product.name} - Rp {product.sell_price.toLocaleString("id-ID")}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Category */}
                    <div className="space-y-2">
                        <Label>Kategori *</Label>
                        <Select value={category} onValueChange={setCategory} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori..." />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">Jumlah *</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                Rp
                            </span>
                            <Input
                                id="amount"
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={formatNumber(amount)}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                className={cn(
                                    "pl-10 text-xl font-semibold h-14",
                                    type === "income" ? "text-income" : "text-expense"
                                )}
                            />
                        </div>
                    </div>

                    {/* Payment Method (Income only) */}
                    {type === "income" && (
                        <div className="space-y-2">
                            <Label>Metode Pembayaran</Label>
                            <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih metode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Tunai (Cash)</SelectItem>
                                    <SelectItem value="qris">QRIS / Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Note */}
                    <div className="space-y-2">
                        <Label htmlFor="note">
                            {type === "expense" ? "Keterangan *" : "Keterangan (opsional)"}
                        </Label>
                        <Textarea
                            id="note"
                            placeholder={type === "expense" ? "Contoh: Beli susu 5L" : "Catatan tambahan..."}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            required={type === "expense"}
                            rows={2}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={handleClose}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className={cn(
                                "flex-1",
                                type === "income"
                                    ? "bg-income hover:bg-income/90"
                                    : "bg-expense hover:bg-expense/90"
                            )}
                            disabled={isLoading || !amount || !category || (type === "expense" && !note)}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                "Simpan"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
