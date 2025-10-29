'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardBody, Button } from '@nextui-org/react'
import { Upload, X, Sparkles } from 'lucide-react'
import { FaceFeatures, loadFaceMesh, analyzeFaceFromImage } from '@/utils/faceAnalysis'
import { PhysiognomyTraits, analyzePhysiognomy } from '@/utils/physiognomy'
import LoadingState from '@/components/LoadingState'

interface FaceAnalyzerProps {
  onAnalysisComplete: (
    features: FaceFeatures,
    traits: PhysiognomyTraits,
    imageUrl: string
  ) => void
  title?: string
  personNumber?: number
}

export default function FaceAnalyzer({
  onAnalysisComplete,
  title = 'Upload Image',
  personNumber,
}: FaceAnalyzerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [faceMesh, setFaceMesh] = useState<any>(null)
  const [showLandmarks, setShowLandmarks] = useState(false)
  const [landmarks, setLandmarks] = useState<any[]>([])

  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load MediaPipe Face Mesh on mount
  useEffect(() => {
    const initModel = async () => {
      setIsModelLoading(true)
      try {
        const model = await loadFaceMesh()
        setFaceMesh(model)
      } catch (err) {
        console.error('Failed to load MediaPipe Face Mesh:', err)
        setError('Failed to load AI models. Please refresh the page.')
      } finally {
        setIsModelLoading(false)
      }
    }

    initModel()
  }, [])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file')
        return
      }

      const url = URL.createObjectURL(file)
      setImageUrl(url)
      setError(null)
    }
  }

  const drawLandmarks = async (detectedLandmarks: any[]) => {
    if (!canvasRef.current || !imageRef.current) return

    const canvas = canvasRef.current
    const img = imageRef.current

    // Set canvas size to match image
    canvas.width = img.width
    canvas.height = img.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw image
    ctx.drawImage(img, 0, 0)

    // MediaPipe Face Mesh contours
    const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
    const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
    const RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
    const LEFT_EYEBROW = [46, 53, 52, 65, 55, 70, 63, 105, 66, 107]
    const RIGHT_EYEBROW = [276, 283, 282, 295, 285, 300, 293, 334, 296, 336]
    const NOSE_BRIDGE = [168, 6, 197, 195, 5, 4]
    const NOSE_TIP = [1, 2, 98, 327]
    const LIPS_UPPER_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291]
    const LIPS_LOWER_OUTER = [146, 91, 181, 84, 17, 314, 405, 321, 375, 291]
    const LIPS_UPPER_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308]
    const LIPS_LOWER_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308]

    // Draw face oval - Red
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    FACE_OVAL.forEach((idx, i) => {
      const point = detectedLandmarks[idx]
      if (i === 0) ctx.moveTo(point.x, point.y)
      else ctx.lineTo(point.x, point.y)
    })
    ctx.closePath()
    ctx.stroke()

    // Draw left eye - Cyan
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'
    ctx.lineWidth = 2
    ctx.beginPath()
    LEFT_EYE.forEach((idx, i) => {
      const point = detectedLandmarks[idx]
      if (i === 0) ctx.moveTo(point.x, point.y)
      else ctx.lineTo(point.x, point.y)
    })
    ctx.closePath()
    ctx.stroke()

    // Draw right eye - Cyan
    ctx.beginPath()
    RIGHT_EYE.forEach((idx, i) => {
      const point = detectedLandmarks[idx]
      if (i === 0) ctx.moveTo(point.x, point.y)
      else ctx.lineTo(point.x, point.y)
    })
    ctx.closePath()
    ctx.stroke()

    // Draw left eyebrow - Blue
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.8)'
    ctx.lineWidth = 2
    ctx.beginPath()
    LEFT_EYEBROW.forEach((idx, i) => {
      const point = detectedLandmarks[idx]
      if (i === 0) ctx.moveTo(point.x, point.y)
      else ctx.lineTo(point.x, point.y)
    })
    ctx.stroke()

    // Draw right eyebrow - Blue
    ctx.beginPath()
    RIGHT_EYEBROW.forEach((idx, i) => {
      const point = detectedLandmarks[idx]
      if (i === 0) ctx.moveTo(point.x, point.y)
      else ctx.lineTo(point.x, point.y)
    })
    ctx.stroke()

    // Draw nose - Yellow
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)'
    ctx.lineWidth = 2
    ctx.beginPath()
    NOSE_BRIDGE.forEach((idx, i) => {
      const point = detectedLandmarks[idx]
      if (i === 0) ctx.moveTo(point.x, point.y)
      else ctx.lineTo(point.x, point.y)
    })
    ctx.stroke()

    // Draw lips outer - Magenta
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)'
    ctx.lineWidth = 2
    ctx.beginPath()
    LIPS_UPPER_OUTER.forEach((idx, i) => {
      const point = detectedLandmarks[idx]
      if (i === 0) ctx.moveTo(point.x, point.y)
      else ctx.lineTo(point.x, point.y)
    })
    ctx.stroke()

    ctx.beginPath()
    LIPS_LOWER_OUTER.forEach((idx, i) => {
      const point = detectedLandmarks[idx]
      if (i === 0) ctx.moveTo(point.x, point.y)
      else ctx.lineTo(point.x, point.y)
    })
    ctx.stroke()

    // Draw key points
    ctx.fillStyle = 'rgba(0, 255, 0, 0.9)'
    const keyPoints = [10, 152, 234, 454, 6, 1, 4, 33, 263, 61, 291]
    keyPoints.forEach((idx) => {
      const point = detectedLandmarks[idx]
      ctx.beginPath()
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Add labels
    ctx.font = 'bold 16px Arial'
    ctx.shadowColor = 'black'
    ctx.shadowBlur = 4

    const labelPoint = (idx: number, label: string, color: string, offsetX: number = 0, offsetY: number = 0) => {
      const point = detectedLandmarks[idx]
      ctx.fillStyle = color
      ctx.fillText(label, point.x + offsetX, point.y + offsetY)
    }

    labelPoint(10, 'Trán', 'rgba(255, 255, 0, 0.9)', -20, -20)
    labelPoint(33, 'Mắt', 'rgba(0, 255, 255, 0.9)', -50, -10)
    labelPoint(1, 'Mũi', 'rgba(255, 255, 0, 0.9)', 10, 0)
    labelPoint(61, 'Miệng', 'rgba(255, 0, 255, 0.9)', -60, 0)
    labelPoint(152, 'Hàm', 'rgba(255, 0, 0, 0.9)', -20, 25)

    ctx.shadowBlur = 0

    setShowLandmarks(true)
  }

  const handleAnalyze = async () => {
    if (!imageRef.current || !faceMesh) {
      setError('Image or model not ready')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Set up MediaPipe callback to get landmarks
      faceMesh.onResults((results: any) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
          setError('Không phát hiện khuôn mặt trong ảnh. Vui lòng thử ảnh khác với khuôn mặt rõ ràng hơn.')
          setIsLoading(false)
          return
        }

        // Get landmarks in pixel coordinates
        const faceLandmarks = results.multiFaceLandmarks[0]
        const pixelLandmarks = faceLandmarks.map((landmark: any) => ({
          x: landmark.x * imageRef.current!.width,
          y: landmark.y * imageRef.current!.height,
          z: landmark.z * imageRef.current!.width,
        }))

        // Save landmarks for drawing
        setLandmarks(pixelLandmarks)

        // Draw landmarks
        drawLandmarks(pixelLandmarks)

        // Continue with analysis
        analyzeFaceFromImage(imageRef.current!, faceMesh).then((features) => {
          if (!features) {
            setError('Lỗi khi phân tích khuôn mặt. Vui lòng thử lại.')
            setIsLoading(false)
            return
          }

          // Analyze physiognomy
          const traits = analyzePhysiognomy(features)

          // Get canvas image with landmarks
          const landmarkImageUrl = canvasRef.current?.toDataURL('image/png') || imageUrl!

          // Call parent callback with landmark image
          onAnalysisComplete(features, traits, landmarkImageUrl)
          setIsLoading(false)
        })
      })

      // Send image to MediaPipe
      await faceMesh.send({ image: imageRef.current })
    } catch (err) {
      console.error('Analysis error:', err)
      setError('An error occurred during analysis. Please try again.')
      setIsLoading(false)
    }
  }

  const handleRemoveImage = () => {
    setImageUrl(null)
    setError(null)
    setShowLandmarks(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (isModelLoading) {
    return (
      <Card>
        <CardBody>
          <LoadingState message="Loading MediaPipe Face Mesh (468 landmarks), please wait..." />
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardBody className="gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {title}
            {personNumber && (
              <span className="ml-2 text-primary">#{personNumber}</span>
            )}
          </h3>
          {imageUrl && (
            <Button
              size="sm"
              color="danger"
              variant="flat"
              startContent={<X className="w-4 h-4" />}
              onPress={handleRemoveImage}
            >
              Remove
            </Button>
          )}
        </div>

        {/* Upload Area */}
        {!imageUrl ? (
          <div
            className="relative border-2 border-dashed border-default-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary-50/50 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-default-400" />
            <p className="text-default-600 mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-default-400">
              PNG, JPG up to 10MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        ) : (
          <>
            {/* Image Preview */}
            <div className="relative w-full aspect-square bg-default-100 rounded-lg overflow-hidden">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Face to analyze"
                className={`w-full h-full object-cover ${showLandmarks ? 'hidden' : ''}`}
                crossOrigin="anonymous"
              />
              <canvas
                ref={canvasRef}
                className={`w-full h-full object-cover ${showLandmarks ? '' : 'hidden'}`}
              />
            </div>

            {/* Toggle Landmarks Button */}
            {showLandmarks && (
              <Button
                size="sm"
                color="secondary"
                variant="flat"
                onPress={() => setShowLandmarks(false)}
                className="w-full"
              >
                Hide Landmarks
              </Button>
            )}

            {/* Analyze Button */}
            <Button
              size="lg"
              color="primary"
              variant="shadow"
              startContent={<Sparkles className="w-5 h-5" />}
              onPress={handleAnalyze}
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Face'}
            </Button>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
            <p className="text-danger-600 text-sm">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-default-500 space-y-1">
          <p>💡 Tips for best results:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Use a clear, front-facing photo</li>
            <li>Ensure good lighting</li>
            <li>Face should be clearly visible</li>
            <li>Avoid heavy makeup or accessories covering features</li>
          </ul>
        </div>
      </CardBody>
    </Card>
  )
}
