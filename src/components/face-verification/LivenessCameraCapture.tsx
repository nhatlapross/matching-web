'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardBody, Button, Progress, Chip } from '@nextui-org/react'
import { Camera, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import {
  generateLivenessChallenges,
  calculateHeadPose,
  isPoseMatched,
  formatPoseInstruction,
  validateLivenessSession,
  type LivenessChallenge,
  type HeadPoseResult,
} from '@/utils/livenessDetection'
import { toast } from 'react-toastify'

interface LivenessCameraCaptureProps {
  onCaptureComplete: (imageDataUrl: string) => void
  onCancel: () => void
}

export default function LivenessCameraCapture({
  onCaptureComplete,
  onCancel,
}: LivenessCameraCaptureProps) {
  const [step, setStep] = useState<'intro' | 'loading' | 'active'>('intro')
  const [isLoading, setIsLoading] = useState(false)
  const [challenges, setChallenges] = useState<LivenessChallenge[]>(
    generateLivenessChallenges()
  )
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0)
  const [headPose, setHeadPose] = useState<HeadPoseResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [poseHoldProgress, setPoseHoldProgress] = useState(0) // State for UI updates

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const faceapiRef = useRef<any>(null)

  // Start camera khi user accept
  const handleStartCamera = async () => {
    // Reset all challenges to ensure clean state
    const freshChallenges = generateLivenessChallenges()
    setChallenges(freshChallenges)
    setCurrentChallengeIndex(0)
    poseHoldTimeRef.current = 0
    lastPoseRef.current = ''
    setPoseHoldProgress(0)

    setStep('loading')
    setIsLoading(true)

    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser không hỗ trợ camera API')
      }

      // Load face-api.js models
      const faceapi = await import('face-api.js')
      faceapiRef.current = faceapi

      const MODEL_URL = '/models'
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ])

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      })

      streamRef.current = stream

      // Change to active step first to render video element
      setStep('active')
      setIsLoading(false)

      // Wait for video element to mount
      await new Promise((resolve) => setTimeout(resolve, 100))

      if (!videoRef.current) {
        throw new Error('Video element not found after mounting')
      }

      const video = videoRef.current

      // Set srcObject
      video.srcObject = stream

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        const onLoadedMetadata = () => {
          resolve()
        }

        if (video.readyState >= 1) {
          onLoadedMetadata()
        } else {
          video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true })
        }
      })

      // Play video
      try {
        await video.play()
      } catch (playError) {
        console.error('Error playing video:', playError)
        throw playError
      }

      // Wait for state to settle
      await new Promise((resolve) => setTimeout(resolve, 200))

      startDetection()
      toast.success('✅ Camera đã sẵn sàng!')
    } catch (error: any) {
      console.error('Error initializing camera:', error)

      let errorMessage = 'Không thể mở camera. '

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Bạn đã từ chối quyền truy cập camera. Vui lòng cho phép trong cài đặt trình duyệt.'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'Không tìm thấy camera. Vui lòng kiểm tra thiết bị.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera đang được sử dụng bởi ứng dụng khác.'
      } else {
        errorMessage += error.message
      }

      toast.error(errorMessage)
      setIsLoading(false)
      setStep('intro')
    }
  }

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Stop camera và cleanup
  const stopCamera = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
  }

  // Start face detection loop
  const startDetection = (forcedChallengeIndex?: number) => {
    // Clear existing interval first to prevent duplicates
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }

    const useIndex = forcedChallengeIndex !== undefined ? forcedChallengeIndex : currentChallengeIndex

    detectionIntervalRef.current = setInterval(async () => {
      await detectFace(useIndex)
    }, 100) // Check every 100ms for smoother response
  }

  // Track pose hold time
  const poseHoldTimeRef = useRef<number>(0)
  const lastPoseRef = useRef<string>('')

  // Detect face và calculate head pose
  const detectFace = async (forcedIndex?: number) => {
    if (!videoRef.current || !faceapiRef.current || isProcessing) return

    try {
      const faceapi = faceapiRef.current
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()

      if (detection) {
        setFaceDetected(true)

        // Calculate head pose
        const pose = calculateHeadPose(detection.landmarks)
        setHeadPose(pose)

        // Use forced index if provided, otherwise use state
        const activeIndex = forcedIndex !== undefined ? forcedIndex : currentChallengeIndex

        const currentChallenge = challenges[activeIndex]
        if (!currentChallenge || currentChallenge.completed) return

        const requiredPose = currentChallenge.pose
        const isMatched = isPoseMatched(pose.currentPose, requiredPose, pose.confidence, 50)

        // Check if current pose matches required challenge
        if (isMatched) {
          // Same pose as before - increment hold time
          if (lastPoseRef.current === pose.currentPose) {
            poseHoldTimeRef.current += 100
            const progress = Math.min(100, Math.round((poseHoldTimeRef.current / 800) * 100))
            setPoseHoldProgress(progress)
          } else {
            // New pose - reset timer
            lastPoseRef.current = pose.currentPose
            poseHoldTimeRef.current = 100
            setPoseHoldProgress(12)
          }

          // Need to hold pose for at least 800ms
          if (poseHoldTimeRef.current >= 800) {
            // Stop detection temporarily while completing
            if (detectionIntervalRef.current) {
              clearInterval(detectionIntervalRef.current)
              detectionIntervalRef.current = null
            }

            // Reset timers
            poseHoldTimeRef.current = 0
            lastPoseRef.current = ''
            setPoseHoldProgress(0)

            // Complete challenge (will update state)
            await completeChallenge(activeIndex)

            // Resume detection with NEXT index - pass explicitly to avoid state lag
            const nextIndex = activeIndex + 1
            if (nextIndex < challenges.length) {
              startDetection(nextIndex)
            }
          }
        } else {
          // Wrong pose - reset timer
          poseHoldTimeRef.current = 0
          lastPoseRef.current = ''
          setPoseHoldProgress(0)
        }
      } else {
        // No face detected
        setFaceDetected(false)
        setHeadPose(null)
        poseHoldTimeRef.current = 0
        lastPoseRef.current = ''
        setPoseHoldProgress(0)
      }
    } catch (error) {
      console.error('Detection error:', error)
    }
  }

  // Complete a challenge
  const completeChallenge = async (index: number) => {
    // Update challenge as completed
    const updatedChallenges = [...challenges]
    updatedChallenges[index].completed = true

    // Move to next challenge immediately
    if (index < challenges.length - 1) {
      const nextIndex = index + 1

      // Update both state at once
      setChallenges(updatedChallenges)
      setCurrentChallengeIndex(nextIndex)

      // Play success sound
      toast.success(`✅ Hoàn thành: ${updatedChallenges[index].instruction}`)

      // Small pause for user to see feedback
      await new Promise((resolve) => setTimeout(resolve, 400))
    } else {
      setChallenges(updatedChallenges)

      // All challenges completed - start countdown to capture
      toast.success('🎉 Hoàn thành tất cả! Chuẩn bị chụp...')
      await startCaptureCountdown()
    }
  }

  // Countdown before capture
  const startCaptureCountdown = async () => {
    for (let i = 3; i > 0; i--) {
      setCountdown(i)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    setCountdown(null)
    capturePhoto()
  }

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95)

    // Stop camera
    stopCamera()

    // Call callback
    toast.success('✅ Đã chụp ảnh khuôn mặt mẫu!')
    onCaptureComplete(imageDataUrl)
  }

  // Restart liveness check
  const handleRestart = () => {
    setChallenges(generateLivenessChallenges())
    setCurrentChallengeIndex(0)
    setHeadPose(null)
    setCountdown(null)
    setIsProcessing(false)
    setPoseHoldProgress(0)
    poseHoldTimeRef.current = 0
    lastPoseRef.current = ''
  }

  const currentChallenge = challenges[currentChallengeIndex]
  const progress = (challenges.filter((c) => c.completed).length / challenges.length) * 100
  const instruction = currentChallenge ? formatPoseInstruction(currentChallenge.pose) : null

  // Intro screen
  if (step === 'intro') {
    return (
      <Card className="w-full">
        <CardBody className="space-y-6 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🎥</div>
            <h3 className="text-2xl font-bold mb-3">Xác thực người thật</h3>
            <p className="text-default-600">
              Để chống giả mạo, bạn cần thực hiện các chuyển động đầu trước camera
            </p>
          </div>

          {/* Camera Permission Notice */}
          <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Camera className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-primary-900 mb-1">
                  📹 Cần quyền truy cập Camera
                </p>
                <p className="text-sm text-primary-800">
                  Sau khi click nút bên dưới, trình duyệt sẽ yêu cầu quyền truy cập camera.
                  Vui lòng click <strong>"Cho phép"</strong> hoặc <strong>"Allow"</strong> để tiếp tục.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-default-100 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              📋 Các bước thực hiện:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">1️⃣</span>
                <div>
                  <p className="font-medium">Click nút "Cho phép Camera"</p>
                  <p className="text-default-500 text-xs">
                    Trình duyệt sẽ popup yêu cầu quyền
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">2️⃣</span>
                <div>
                  <p className="font-medium">Thực hiện chuyển động theo hướng dẫn</p>
                  <p className="text-default-500 text-xs">
                    Quay trái 👈, quay phải 👉, ngước lên 👆, cúi xuống 👇
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">3️⃣</span>
                <div>
                  <p className="font-medium">Quay về giữa để chụp</p>
                  <p className="text-default-500 text-xs">
                    Countdown 3-2-1 rồi tự động chụp
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 text-sm">
            <p className="font-medium text-warning-800 mb-1">⚠️ Lưu ý:</p>
            <ul className="text-warning-700 space-y-1 text-xs ml-4 list-disc">
              <li>Đảm bảo đủ ánh sáng và khuôn mặt rõ ràng</li>
              <li>Thực hiện chuyển động chậm rãi, không vội vàng</li>
              <li>Không được dùng ảnh tĩnh hoặc video có sẵn</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              color="success"
              size="lg"
              className="font-semibold text-lg"
              startContent={<Camera className="h-6 w-6" />}
              onPress={handleStartCamera}
            >
              ✅ Cho phép Camera & Bắt đầu
            </Button>
            <Button
              color="default"
              variant="light"
              size="lg"
              onPress={onCancel}
            >
              Hủy bỏ
            </Button>
          </div>
        </CardBody>
      </Card>
    )
  }

  // Loading screen
  if (step === 'loading' || isLoading) {
    return (
      <Card className="w-full">
        <CardBody className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mb-4"></div>
          <p className="text-lg font-medium mb-2">Đang khởi động camera...</p>
          <p className="text-sm text-default-500">Vui lòng cho phép truy cập camera</p>
        </CardBody>
      </Card>
    )
  }

  // Active camera screen
  return (
    <Card className="w-full">
      <CardBody className="space-y-4">
        {/* Video & Canvas */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Countdown overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-white text-9xl font-bold animate-pulse">
                {countdown}
              </div>
            </div>
          )}

          {/* Face detection indicator */}
          <div className="absolute top-4 left-4">
            {faceDetected ? (
              <Chip color="success" startContent={<CheckCircle className="h-4 w-4" />}>
                Phát hiện khuôn mặt
              </Chip>
            ) : (
              <Chip color="danger" startContent={<XCircle className="h-4 w-4" />}>
                Không thấy khuôn mặt
              </Chip>
            )}
          </div>

          {/* Head pose debug info */}
          {headPose && (
            <div className="absolute top-4 right-4 bg-black/70 text-white text-xs p-2 rounded">
              <div>Pose: {headPose.currentPose}</div>
              <div>Confidence: {headPose.confidence}%</div>
              <div>Yaw: {headPose.yaw}° | Pitch: {headPose.pitch}°</div>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Tiến trình</span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <Progress
            value={progress}
            color="success"
            aria-label="Tiến trình xác thực"
          />
        </div>

        {/* Current instruction */}
        {instruction && (
          <Card className="bg-primary-50 border-2 border-primary">
            <CardBody className="text-center py-6">
              <div className="text-6xl mb-3">{instruction.emoji}</div>
              <h3 className="text-2xl font-bold text-primary mb-2">
                {instruction.text}
              </h3>
              {headPose && (
                <div className="space-y-2">
                  {isPoseMatched(headPose.currentPose, currentChallenge.pose, headPose.confidence, 50) ? (
                    <div className="space-y-2">
                      <p className="text-lg font-bold text-success">
                        ✅ Giữ tư thế... {poseHoldProgress}%
                      </p>
                      <div className="w-full bg-success-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-success h-full transition-all duration-100"
                          style={{ width: `${poseHoldProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-primary-600">
                      Hiện tại: {headPose.currentPose} ({headPose.confidence}%)
                    </p>
                  )}
                  <div className="flex gap-4 text-xs text-primary-600 justify-center">
                    <span>Trái/Phải: {headPose.yaw}°</span>
                    <span>Trên/Dưới: {headPose.pitch}°</span>
                  </div>
                  {!isPoseMatched(headPose.currentPose, currentChallenge.pose, headPose.confidence, 50) && (
                    <p className="text-xs text-warning-600">
                      💡 {currentChallenge.pose === 'left' || currentChallenge.pose === 'right'
                        ? 'Quay đầu rõ hơn (cần ≥8°)'
                        : 'Ngửa/cúi đầu rõ hơn (cần ≥8°)'}
                    </p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Challenge list */}
        <div className="grid grid-cols-5 gap-2">
          {challenges.map((challenge, index) => (
            <div
              key={index}
              className={`text-center p-2 rounded-lg border-2 transition-all ${
                challenge.completed
                  ? 'border-success bg-success-50'
                  : index === currentChallengeIndex
                  ? 'border-primary bg-primary-50 scale-110'
                  : 'border-default-200'
              }`}
            >
              <div className="text-2xl">
                {formatPoseInstruction(challenge.pose).emoji}
              </div>
              {challenge.completed && <CheckCircle className="h-4 w-4 text-success mx-auto mt-1" />}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            color="default"
            variant="flat"
            startContent={<RotateCcw className="h-4 w-4" />}
            onPress={handleRestart}
          >
            Làm lại
          </Button>
          <Button color="danger" variant="flat" onPress={onCancel} className="flex-1">
            Hủy
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-default-500 space-y-1">
          <p className="font-semibold">💡 Hướng dẫn:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Đảm bảo khuôn mặt nằm trong khung hình</li>
            <li>Thực hiện các chuyển động theo hướng dẫn</li>
            <li>Giữ mỗi tư thế trong 1-2 giây</li>
            <li>Sau khi hoàn thành, hệ thống sẽ tự động chụp ảnh</li>
          </ul>
        </div>
      </CardBody>
    </Card>
  )
}
