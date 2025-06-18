"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Upload, Download, ImageIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface ImageData {
  file: File
  url: string
  width: number
  height: number
  size: number
}

interface ResizedImageData {
  url: string
  width: number
  height: number
  size: number
  blob: Blob
}

export default function ImageResizer() {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null)
  const [resizedImage, setResizedImage] = useState<ResizedImageData | null>(null)
  const [customWidth, setCustomWidth] = useState<number>(800)
  const [customHeight, setCustomHeight] = useState<number>(600)
  const [quality, setQuality] = useState<number[]>([80])
  const [resizeMode, setResizeMode] = useState<string>("custom")
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [outputFormat, setOutputFormat] = useState<string>("image/jpeg")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const loadImage = (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        resolve({
          file,
          url,
          width: img.width,
          height: img.height,
          size: file.size,
        })
      }

      img.onerror = reject
      img.src = url
    })
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file")
      return
    }

    try {
      const imageData = await loadImage(file)
      setOriginalImage(imageData)
      setCustomWidth(imageData.width)
      setCustomHeight(imageData.height)
      setResizedImage(null)
    } catch (error) {
      console.error("Error loading image:", error)
      alert("Error loading image")
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const calculateDimensions = (originalWidth: number, originalHeight: number) => {
    let newWidth = customWidth
    let newHeight = customHeight

    switch (resizeMode) {
      case "percentage":
        const percentage = customWidth / 100
        newWidth = Math.round(originalWidth * percentage)
        newHeight = Math.round(originalHeight * percentage)
        break
      case "preset-small":
        newWidth = 400
        newHeight = maintainAspectRatio ? Math.round((400 * originalHeight) / originalWidth) : 300
        break
      case "preset-medium":
        newWidth = 800
        newHeight = maintainAspectRatio ? Math.round((800 * originalHeight) / originalWidth) : 600
        break
      case "preset-large":
        newWidth = 1200
        newHeight = maintainAspectRatio ? Math.round((1200 * originalHeight) / originalWidth) : 900
        break
      case "custom":
        if (maintainAspectRatio) {
          const aspectRatio = originalWidth / originalHeight
          if (newWidth / newHeight > aspectRatio) {
            newWidth = Math.round(newHeight * aspectRatio)
          } else {
            newHeight = Math.round(newWidth / aspectRatio)
          }
        }
        break
    }

    return { width: newWidth, height: newHeight }
  }

  const resizeImage = async () => {
    if (!originalImage || !canvasRef.current) return

    setIsProcessing(true)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = "anonymous"

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = originalImage.url
      })

      const { width, height } = calculateDimensions(originalImage.width, originalImage.height)

      canvas.width = width
      canvas.height = height

      // Use better image scaling
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            setResizedImage({
              url,
              width,
              height,
              size: blob.size,
              blob,
            })
          }
          setIsProcessing(false)
        },
        outputFormat,
        outputFormat === "image/jpeg" ? quality[0] / 100 : undefined,
      )
    } catch (error) {
      console.error("Error resizing image:", error)
      setIsProcessing(false)
    }
  }

  const downloadImage = () => {
    if (!resizedImage) return

    const link = document.createElement("a")
    link.href = resizedImage.url

    // Set the correct file extension based on format
    let extension = "jpg"
    switch (outputFormat) {
      case "image/png":
        extension = "png"
        break
      case "image/webp":
        extension = "webp"
        break
      case "image/jpeg":
        extension = "jpg"
        break
      case "image/gif":
        extension = "gif"
        break
      case "image/avif":
        extension = "avif"
        break
    }

    link.download = `resized-${originalImage?.file.name.split(".")[0] || "image"}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resetImage = () => {
    setOriginalImage(null)
    setResizedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleWidthChange = (value: string) => {
    const newWidth = Number.parseInt(value) || 0
    setCustomWidth(newWidth)

    if (maintainAspectRatio && originalImage) {
      const aspectRatio = originalImage.width / originalImage.height
      setCustomHeight(Math.round(newWidth / aspectRatio))
    }
  }

  const handleHeightChange = (value: string) => {
    const newHeight = Number.parseInt(value) || 0
    setCustomHeight(newHeight)

    if (maintainAspectRatio && originalImage) {
      const aspectRatio = originalImage.width / originalImage.height
      setCustomWidth(Math.round(newHeight * aspectRatio))
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Image Size Reducer</h1>
        <p className="text-muted-foreground">Compress and resize your images while maintaining quality</p>
      </div>

      {!originalImage ? (
        <Card>
          <CardContent className="p-6">
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload an image</h3>
              <p className="text-muted-foreground mb-4">Drag and drop your image here, or click to browse</p>
              <p className="text-sm text-muted-foreground">Supports JPG, PNG, WebP formats</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Resize Settings
              </CardTitle>
              <CardDescription>Configure how you want to resize your image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={resizeMode} onValueChange={setResizeMode}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                  <TabsTrigger value="percentage">Percentage</TabsTrigger>
                  <TabsTrigger value="preset-medium">Presets</TabsTrigger>
                </TabsList>

                <TabsContent value="custom" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="width">Width (px)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={customWidth}
                        onChange={(e) => handleWidthChange(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (px)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={customHeight}
                        onChange={(e) => handleHeightChange(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="aspect-ratio"
                      checked={maintainAspectRatio}
                      onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="aspect-ratio">Maintain aspect ratio</Label>
                  </div>
                </TabsContent>

                <TabsContent value="percentage" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="percentage">Scale Percentage</Label>
                    <Input
                      id="percentage"
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Number.parseInt(e.target.value) || 100)}
                      min="1"
                      max="200"
                    />
                    <p className="text-sm text-muted-foreground">{customWidth}% of original size</p>
                  </div>
                </TabsContent>

                <TabsContent value="preset-medium" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Choose a preset size</Label>
                    <Select value={resizeMode} onValueChange={setResizeMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preset-small">Small (400px width)</SelectItem>
                        <SelectItem value="preset-medium">Medium (800px width)</SelectItem>
                        <SelectItem value="preset-large">Large (1200px width)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label>Quality: {quality[0]}%</Label>
                <Slider value={quality} onValueChange={setQuality} max={100} min={10} step={5} className="w-full" />
                <p className="text-sm text-muted-foreground">Higher quality = larger file size</p>
              </div>

              <div className="space-y-2">
                <Label>Output Format</Label>
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image/jpeg">JPEG (Smaller size, lossy)</SelectItem>
                    <SelectItem value="image/png">PNG (Larger size, lossless)</SelectItem>
                    <SelectItem value="image/webp">WebP (Small size, high quality)</SelectItem>
                    <SelectItem value="image/gif">GIF (Animation support)</SelectItem>
                    <SelectItem value="image/avif">AVIF (Best compression, modern)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {outputFormat === "image/jpeg" && "Best for photos with smaller file sizes"}
                  {outputFormat === "image/png" && "Best for graphics with transparency"}
                  {outputFormat === "image/webp" && "Modern format with excellent compression"}
                  {outputFormat === "image/gif" && "Supports animation, limited colors"}
                  {outputFormat === "image/avif" && "Newest format with best compression (limited browser support)"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={resizeImage} disabled={isProcessing} className="flex-1">
                  {isProcessing ? "Processing..." : "Resize Image"}
                </Button>
                <Button variant="outline" onClick={resetImage}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Original vs resized image comparison</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Original Image Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Original</h4>
                  <Badge variant="secondary">
                    {originalImage.width} × {originalImage.height}
                  </Badge>
                </div>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={originalImage.url || "/placeholder.svg"}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Size: {formatFileSize(originalImage.size)}</p>
              </div>

              {/* Resized Image */}
              {resizedImage && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Resized</h4>
                    <Badge variant="secondary">
                      {resizedImage.width} × {resizedImage.height}
                    </Badge>
                  </div>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={resizedImage.url || "/placeholder.svg"}
                      alt="Resized"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Size: {formatFileSize(resizedImage.size)}</p>
                    <p className="text-sm text-muted-foreground">Format: {outputFormat.split("/")[1].toUpperCase()}</p>
                    <Badge variant="outline" className="text-green-600">
                      {Math.round(((originalImage.size - resizedImage.size) / originalImage.size) * 100)}% smaller
                    </Badge>
                  </div>
                  <Button onClick={downloadImage} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Resized Image
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
