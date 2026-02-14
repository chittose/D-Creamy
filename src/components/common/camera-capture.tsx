"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, X, RotateCcw, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface CameraCaptureProps {
    open: boolean
    onClose: () => void
    onCapture: (imageData: string) => void
    title?: string
}

export function CameraCapture({
    open,
    onClose,
    onCapture,
    title = "Ambil Foto",
}: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")

    const startCamera = useCallback(async () => {
        try {
            setError(null)
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
        } catch (err) {
            console.error("Camera error:", err)
            setError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.")
        }
    }, [facingMode])

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop())
            setStream(null)
        }
    }, [stream])

    useEffect(() => {
        if (open && !capturedImage) {
            startCamera()
        }
        return () => {
            stopCamera()
        }
    }, [open, capturedImage, startCamera, stopCamera])

    const capture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current
            const canvas = canvasRef.current
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext("2d")
            if (ctx) {
                ctx.drawImage(video, 0, 0)
                const imageData = canvas.toDataURL("image/jpeg", 0.8)
                setCapturedImage(imageData)
                stopCamera()
            }
        }
    }

    const retake = () => {
        setCapturedImage(null)
        startCamera()
    }

    const confirm = () => {
        if (capturedImage) {
            onCapture(capturedImage)
            handleClose()
        }
    }

    const handleClose = () => {
        stopCamera()
        setCapturedImage(null)
        setError(null)
        onClose()
    }

    const toggleCamera = () => {
        stopCamera()
        setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md p-0 overflow-hidden">
                <DialogHeader className="p-4 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="relative aspect-[4/3] bg-black">
                    {error ? (
                        <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
                            <div>
                                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
                    ) : capturedImage ? (
                        <img
                            src={capturedImage}
                            alt="Captured"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                    )}

                    <canvas ref={canvasRef} className="hidden" />

                    {/* Camera switch button */}
                    {!capturedImage && !error && (
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-2 right-2 rounded-full"
                            onClick={toggleCamera}
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 flex gap-3">
                    {capturedImage ? (
                        <>
                            <Button variant="outline" className="flex-1" onClick={retake}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Ulang
                            </Button>
                            <Button className="flex-1 bg-income hover:bg-income/90" onClick={confirm}>
                                <Check className="h-4 w-4 mr-2" />
                                Gunakan
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" className="flex-1" onClick={handleClose}>
                                Batal
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={capture}
                                disabled={!!error}
                            >
                                <Camera className="h-4 w-4 mr-2" />
                                Ambil Foto
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
