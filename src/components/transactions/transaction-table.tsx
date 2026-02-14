"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
    ArrowUpDown,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import type { Transaction } from "./transaction-card"

interface TransactionTableProps {
    transactions: Transaction[]
    onEdit?: (tx: Transaction) => void
    onDelete?: (tx: Transaction) => void
    pageSize?: number
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

type SortField = "date" | "amount" | "category"
type SortOrder = "asc" | "desc"

export function TransactionTable({
    transactions,
    onEdit,
    onDelete,
    pageSize = 10,
}: TransactionTableProps) {
    const [sortField, setSortField] = useState<SortField>("date")
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
    const [currentPage, setCurrentPage] = useState(1)
    const [filter, setFilter] = useState("")

    // Filter
    const filtered = transactions.filter((tx) => {
        if (!filter) return true
        const search = filter.toLowerCase()
        return (
            tx.product?.toLowerCase().includes(search) ||
            tx.category.toLowerCase().includes(search) ||
            tx.note?.toLowerCase().includes(search)
        )
    })

    // Sort
    const sorted = [...filtered].sort((a, b) => {
        let cmp = 0
        switch (sortField) {
            case "date":
                cmp = a.createdAt.getTime() - b.createdAt.getTime()
                break
            case "amount":
                cmp = a.amount - b.amount
                break
            case "category":
                cmp = a.category.localeCompare(b.category)
                break
        }
        return sortOrder === "asc" ? cmp : -cmp
    })

    // Paginate
    const totalPages = Math.ceil(sorted.length / pageSize)
    const paginated = sorted.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortOrder("desc")
        }
    }

    const SortButton = ({ field, label }: { field: SortField; label: string }) => (
        <Button
            variant="ghost"
            size="sm"
            className="h-8 -ml-3 font-medium"
            onClick={() => handleSort(field)}
        >
            {label}
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    )

    return (
        <div className="space-y-4">
            {/* Filter */}
            <Input
                placeholder="Filter transaksi..."
                value={filter}
                onChange={(e) => {
                    setFilter(e.target.value)
                    setCurrentPage(1)
                }}
                className="max-w-sm"
            />

            {/* Table */}
            <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[180px]">
                                <SortButton field="date" label="Tanggal" />
                            </TableHead>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead>
                                <SortButton field="category" label="Kategori" />
                            </TableHead>
                            <TableHead className="text-right">
                                <SortButton field="amount" label="Jumlah" />
                            </TableHead>
                            <TableHead className="w-[100px]">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginated.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Tidak ada transaksi ditemukan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginated.map((tx) => (
                                <TableRow key={tx.id} className="hover:bg-muted/30">
                                    <TableCell className="font-medium">
                                        {format(tx.createdAt, "dd MMM yyyy, HH:mm", { locale: id })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    "inline-block w-2 h-2 rounded-full",
                                                    tx.type === "income" ? "bg-income" : "bg-expense"
                                                )}
                                            />
                                            {tx.product || tx.note || "-"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{tx.category}</Badge>
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            "text-right font-semibold tabular-nums",
                                            tx.type === "income" ? "text-income" : "text-expense"
                                        )}
                                    >
                                        {tx.type === "income" ? "+" : "-"}
                                        {formatRupiah(tx.amount)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => onEdit?.(tx)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() => onDelete?.(tx)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Menampilkan {(currentPage - 1) * pageSize + 1} -{" "}
                        {Math.min(currentPage * pageSize, sorted.length)} dari {sorted.length}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
