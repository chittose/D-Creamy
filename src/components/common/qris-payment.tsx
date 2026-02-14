"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface QRCodeDisplayProps {
    /** Data to encode in QR code - typically payment URL */
    data: string
    /** Size in pixels */
    size?: number
    /** Alt text */
    alt?: string
    className?: string
}

/**
 * QR Code display component for QRIS payments
 * Uses QR Server API to generate QR codes
 */
export function QRCodeDisplay({
    data,
    size = 200,
    alt = "QR Code",
    className,
}: QRCodeDisplayProps) {
    // Using QR Server API for generation
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`

    return (
        <div className={cn("inline-flex items-center justify-center p-4 bg-white rounded-xl", className)}>
            <Image
                src={qrUrl}
                alt={alt}
                width={size}
                height={size}
                className="rounded-lg"
                unoptimized // External URL
            />
        </div>
    )
}

interface QRISPaymentProps {
    /** QRIS static code or merchant ID */
    qrisCode: string
    /** Amount in IDR */
    amount: number
    /** Merchant name */
    merchantName: string
    /** On payment confirmed callback */
    onConfirm?: () => void
    /** On cancel callback */
    onCancel?: () => void
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

/**
 * QRIS Payment display component
 * Shows QR code with payment details
 */
export function QRISPayment({
    qrisCode,
    amount,
    merchantName,
    onConfirm,
    onCancel,
}: QRISPaymentProps) {
    return (
        <div className="flex flex-col items-center space-y-6 p-6">
            {/* Header */}
            <div className="text-center">
                <h3 className="text-lg font-semibold">Pembayaran QRIS</h3>
                <p className="text-sm text-muted-foreground">{merchantName}</p>
            </div>

            {/* QR Code */}
            <QRCodeDisplay data={qrisCode} size={200} alt="QRIS Payment Code" />

            {/* Amount */}
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                <p className="text-3xl font-bold text-primary tabular-nums">
                    {formatRupiah(amount)}
                </p>
            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-muted-foreground space-y-1">
                <p>Scan QR code menggunakan:</p>
                <p className="font-medium">GoPay • OVO • Dana • LinkAja • ShopeePay</p>
                <p>atau aplikasi mobile banking Anda</p>
            </div>

            {/* Actions */}
            {(onConfirm || onCancel) && (
                <div className="flex gap-3 w-full max-w-xs">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="flex-1 py-2 px-4 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                        >
                            Batal
                        </button>
                    )}
                    {onConfirm && (
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-2 px-4 bg-income text-white rounded-lg text-sm font-medium hover:bg-income/90 transition-colors"
                        >
                            Sudah Bayar
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
