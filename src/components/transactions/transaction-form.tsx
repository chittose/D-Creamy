"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Camera, X } from "lucide-react"

interface TransactionFormProps {
    type?: "income" | "expense"
    onSubmit?: (data: TransactionFormData) => void
    onCancel?: () => void
    initialData?: Partial<TransactionFormData>
    loading?: boolean
}

export interface TransactionFormData {
    type: "income" | "expense"
    amount: number
    category: string
    note: string
    receiptUrl?: string
}

const incomeCategories = [
    "Penjualan",
    "Pendapatan Lain",
]

const expenseCategories = [
    "Bahan Baku",
    "Operasional",
    "Gaji",
    "Listrik & Air",
    "Sewa",
    "Peralatan",
    "Lainnya",
]

export function TransactionForm({
    type: initialType = "expense",
    onSubmit,
    onCancel,
    initialData,
    loading = false,
}: TransactionFormProps) {
    const [type, setType] = useState<"income" | "expense">(
        initialData?.type || initialType
    )
    const [amount, setAmount] = useState(initialData?.amount?.toString() || "")
    const [category, setCategory] = useState(initialData?.category || "")
    const [note, setNote] = useState(initialData?.note || "")

    const categories = type === "income" ? incomeCategories : expenseCategories

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || !category) return

        onSubmit?.({
            type,
            amount: parseInt(amount.replace(/\D/g, ""), 10),
            category,
            note,
        })
    }

    const formatAmount = (value: string) => {
        const num = value.replace(/\D/g, "")
        if (!num) return ""
        return new Intl.NumberFormat("id-ID").format(parseInt(num, 10))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Toggle */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <button
                    type="button"
                    onClick={() => {
                        setType("income")
                        setCategory("")
                    }}
                    className={cn(
                        "flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all",
                        type === "income"
                            ? "bg-income text-white shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    💰 Pemasukan
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setType("expense")
                        setCategory("")
                    }}
                    className={cn(
                        "flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all",
                        type === "expense"
                            ? "bg-expense text-white shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    💸 Pengeluaran
                </button>
            </div>

            {/* Amount */}
            <div className="space-y-2">
                <Label htmlFor="amount">Jumlah</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        Rp
                    </span>
                    <Input
                        id="amount"
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={formatAmount(amount)}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-10 text-xl font-semibold h-14 tabular-nums"
                        required
                    />
                </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger id="category" className="h-12">
                        <SelectValue placeholder="Pilih kategori" />
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

            {/* Note */}
            <div className="space-y-2">
                <Label htmlFor="note">Catatan (opsional)</Label>
                <Textarea
                    id="note"
                    placeholder="Tambah catatan..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                />
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
                <Label>Struk (opsional)</Label>
                <button
                    type="button"
                    className="flex items-center gap-3 w-full p-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                    <Camera className="h-5 w-5" />
                    <span className="text-sm">Tambah foto struk</span>
                </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-12"
                        onClick={onCancel}
                    >
                        Batal
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={loading || !amount || !category}
                    className={cn(
                        "flex-1 h-12 font-semibold",
                        type === "income"
                            ? "bg-income hover:bg-income/90"
                            : "bg-expense hover:bg-expense/90"
                    )}
                >
                    {loading ? "Menyimpan..." : "Simpan"}
                </Button>
            </div>
        </form>
    )
}
