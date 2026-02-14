"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Camera, Upload, X, Loader2 } from "lucide-react"
import { getUntypedSupabaseClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface ProductFormProps {
    open: boolean
    onClose: () => void
    onSuccess?: () => void
    warungId: string
    editProduct?: {
        id: string
        name: string
        buy_price: number
        sell_price: number
        stock: number
        category: string
        image_url?: string | null
    }
}

const categories = [
    "Minuman",
    "Makanan",
    "Snack",
    "Bahan Baku",
    "Lainnya",
]

export function ProductForm({
    open,
    onClose,
    onSuccess,
    warungId,
    editProduct,
}: ProductFormProps) {
    const [name, setName] = useState(editProduct?.name || "")
    const [buyPrice, setBuyPrice] = useState(editProduct?.buy_price?.toString() || "")
    const [sellPrice, setSellPrice] = useState(editProduct?.sell_price?.toString() || "")
    const [stock, setStock] = useState(editProduct?.stock?.toString() || "1000")
    const [category, setCategory] = useState(editProduct?.category || "Minuman")
    const [imageUrl, setImageUrl] = useState(editProduct?.image_url || "")
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(editProduct?.image_url || null)
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState("")

    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = getUntypedSupabaseClient()

    // Sync form state when editProduct or dialog open state changes.
    // Without this, switching between add/edit mode shows stale data.
    useEffect(() => {
        if (open) {
            setName(editProduct?.name || "")
            setBuyPrice(editProduct?.buy_price?.toString() || "")
            setSellPrice(editProduct?.sell_price?.toString() || "")
            setStock(editProduct?.stock?.toString() || "1000")
            setCategory(editProduct?.category || "Minuman")
            setImageUrl(editProduct?.image_url || "")
            setImageFile(null)
            setImagePreview(editProduct?.image_url || null)
            setError("")
        }
    }, [open, editProduct])

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Max 2MB
        if (file.size > 2 * 1024 * 1024) {
            setError("Ukuran gambar maksimal 2MB")
            return
        }

        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
        setError("")
    }

    const removeImage = () => {
        setImageFile(null)
        setImagePreview(null)
        setImageUrl("")
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            setIsUploading(true)

            const fileExt = file.name.split('.').pop()
            const fileName = `${warungId}/${Date.now()}.${fileExt}`

            const { data, error } = await supabase.storage
                .from("product-images")
                .upload(fileName, file, {
                    cacheControl: "3600",
                    upsert: false,
                })

            if (error) throw error

            // Get public URL
            const { data: urlData } = supabase.storage
                .from("product-images")
                .getPublicUrl(fileName)

            return urlData.publicUrl
        } catch (err) {
            console.error("Upload error:", err)
            setError("Gagal upload gambar. Pastikan bucket 'product-images' sudah dibuat di Supabase Storage.")
            return null
        } finally {
            setIsUploading(false)
        }
    }

    const formatNumber = (value: string) => {
        const num = value.replace(/\D/g, "")
        if (!num) return ""
        return new Intl.NumberFormat("id-ID").format(parseInt(num, 10))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !sellPrice) return

        if (!warungId) {
            setError("Data Warung tidak ditemukan. Silakan refresh halaman atau login ulang.")
            return
        }

        setError("")
        setIsLoading(true)

        try {
            let finalImageUrl = imageUrl

            // Upload new image if selected
            if (imageFile) {
                const uploadedUrl = await uploadImage(imageFile)
                if (uploadedUrl) {
                    finalImageUrl = uploadedUrl
                }
            }

            const productData = {
                name,
                buy_price: parseInt(buyPrice.replace(/\D/g, "") || "0", 10),
                sell_price: parseInt(sellPrice.replace(/\D/g, ""), 10),
                stock: parseInt(stock || "0", 10),
                category,
                image_url: finalImageUrl || null,
                warung_id: warungId,
            }

            if (editProduct) {
                // Update existing
                const { error } = await supabase
                    .from("products")
                    .update(productData)
                    .eq("id", editProduct.id)

                if (error) throw error
            } else {
                // Create new
                const { error } = await supabase
                    .from("products")
                    .insert(productData)

                if (error) throw error
            }

            onSuccess?.()
            onClose()
        } catch (err: any) {

            // Handle specific Supabase errors
            if (err?.code === '22P02') { // invalid input syntax for type uuid
                setError("ID Warung tidak valid. Silakan relogin.")
            } else if (err?.message) {
                setError(`Gagal: ${err.message}`)
            } else {
                setError("Gagal menyimpan produk. Coba lagi.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editProduct ? "Edit Produk" : "Tambah Produk Baru"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label>Gambar Produk</Label>
                        <div className="flex items-center gap-4">
                            {imagePreview ? (
                                <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-border">
                                    <Image
                                        src={imagePreview}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                >
                                    <Camera className="h-6 w-6 mb-1" />
                                    <span className="text-xs">Upload</span>
                                </button>
                            )}
                            <div className="flex-1 text-sm text-muted-foreground">
                                <p>Format: JPG, PNG</p>
                                <p>Maks. 2MB</p>
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Produk *</Label>
                        <Input
                            id="name"
                            placeholder="Es Coklat"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label>Kategori</Label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                                        category === cat
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "border-border hover:border-primary"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Prices */}
                    <div className="space-y-2">
                        <Label htmlFor="sellPrice">Harga Jual *</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                Rp
                            </span>
                            <Input
                                id="sellPrice"
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={formatNumber(sellPrice)}
                                onChange={(e) => setSellPrice(e.target.value)}
                                required
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Buy Price Hidden */}
                    {/* <div className="space-y-2">
                        <Label htmlFor="buyPrice">Harga Beli</Label>
                         ...
                    </div> */}

                    {/* Stock Input Hidden (Default to 1000 as requested: 'ga usah pake stok') */}
                    {/* <div className="space-y-2">
                        <Label htmlFor="stock">Stok Awal</Label>
                        <Input
                            id="stock"
                            type="number"
                            inputMode="numeric"
                            placeholder="0"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            min={0}
                        />
                    </div> */}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isLoading || isUploading || !name || !sellPrice}
                        >
                            {isLoading || isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isUploading ? "Uploading..." : "Menyimpan..."}
                                </>
                            ) : (
                                editProduct ? "Simpan Perubahan" : "Tambah Produk"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
