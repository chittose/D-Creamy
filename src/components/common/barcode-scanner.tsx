"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Scan, X, Flashlight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface BarcodeScannerProps {
    open: boolean
    onClose: () => void
    onScan: (barcode: string) => void
    title?: string
}

export function BarcodeScanner({
    open,
    onClose,
    onScan,
    title = "Scan Barcode",
}: BarcodeScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [torch, setTorch] = useState(false)
    const [scanning, setScanning] = useState(false)

    const startCamera = useCallback(async () => {
        try {
            setError(null)
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
            setScanning(true)
        } catch (err) {
            console.error("Camera error:", err)
            setError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.")
        }
    }, [])

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop())
            setStream(null)
        }
        setScanning(false)
    }, [stream])

    useEffect(() => {
        if (open) {
            startCamera()
        }
        return () => {
            stopCamera()
        }
    }, [open, startCamera, stopCamera])

    // Barcode detection using BarcodeDetector API (Chrome 83+)
    useEffect(() => {
        if (!scanning || !videoRef.current) return

        // Check if BarcodeDetector is available
        if (!("BarcodeDetector" in window)) {
            // Fallback message - would need a library like @aspect/barcode for full support
            console.log("BarcodeDetector API not available")
            return
        }

        const detector = new (window as unknown as { BarcodeDetector: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector({
            formats: ["ean_13", "ean_8", "code_128", "code_39", "qr_code"],
        })

        let animationId: number

        const scan = async () => {
            if (!scanning || !videoRef.current) return

            try {
                const barcodes = await detector.detect(videoRef.current)
                if (barcodes.length > 0) {
                    const barcode = barcodes[0].rawValue
                    onScan(barcode)
                    handleClose()
                    return
                }
            } catch (err) {
                // Ignore detection errors, keep scanning
            }

            animationId = requestAnimationFrame(scan)
        }

        scan()

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId)
            }
        }
    }, [scanning, onScan])

    const toggleTorch = async () => {
        if (!stream) return

        const track = stream.getVideoTracks()[0]
        const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }

        if (capabilities.torch) {
            const newTorch = !torch
            await track.applyConstraints({
                advanced: [{ torch: newTorch } as MediaTrackConstraintSet],
            })
            setTorch(newTorch)
        }
    }

    const handleClose = () => {
        stopCamera()
        setError(null)
        onClose()
    }

    const handleManualInput = () => {
        const barcode = prompt("Masukkan kode barcode secara manual:")
        if (barcode) {
            onScan(barcode)
            handleClose()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md p-0 overflow-hidden">
                <DialogHeader className="p-4 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <Scan className="h-5 w-5" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="relative aspect-[4/3] bg-black">
                    {error ? (
                        <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
                            <div>
                                <Scan className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-sm">{error}</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={startCamera}
                                >
                                    Coba Lagi
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />

                            {/* Scanning overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-64 h-32 border-2 border-primary rounded-lg relative">
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br-lg" />

                                    {/* Scanning line animation */}
                                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary animate-pulse" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Torch button */}
                    {!error && (
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-2 right-2 rounded-full"
                            onClick={toggleTorch}
                        >
                            <Flashlight className={torch ? "h-4 w-4 text-yellow-500" : "h-4 w-4"} />
                        </Button>
                    )}
                </div>

                <div className="p-4 text-center text-sm text-muted-foreground">
                    Arahkan kamera ke barcode produk
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={handleClose}>
                        Batal
                    </Button>
                    <Button variant="secondary" className="flex-1" onClick={handleManualInput}>
                        Input Manual
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
