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

  // Start camera when user accepts
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
        throw new Error('Browser does not support camera API')
      }

      // Load face-api.js models
      const faceapi = await import('face-api.js')
      faceapiRef.current = faceapi

      const MODEL_URL = '/models'
      
      // Only load models if not already loaded
      // Use ssdMobilenetv1 instead of tinyFaceDetector for better compatibility
      try {
        if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
          console.log('Loading ssdMobilenetv1 from:', MODEL_URL)
          try {
            await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
            console.log('✅ ssdMobilenetv1 loaded')
          } catch (err) {
            console.error('❌ Failed to load ssdMobilenetv1:', err)
            throw err
          }
        }
        
        if (!faceapi.nets.faceLandmark68Net.isLoaded) {
          console.log('Loading faceLandmark68Net from:', MODEL_URL)
          try {
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
            console.log('✅ faceLandmark68Net loaded')
          } catch (err) {
            console.error('❌ Failed to load faceLandmark68Net:', err)
            throw err
          }
        }
        
        console.log('✅ All models loaded successfully')
      } catch (modelError) {
        console.error('Error loading models:', modelError)
        // Log more details
        if (modelError instanceof Error) {
          console.error('Model error details:', {
            message: modelError.message,
            stack: modelError.stack,
            name: modelError.name
          })
        }
        throw new Error('Failed to load AI models. Please refresh the page and try again.')
      }

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
      toast.success('✅ Camera ready!')
    } catch (error: any) {
      console.error('Error initializing camera:', error)

      let errorMessage = 'Cannot open camera. '

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'You denied camera access. Please allow it in browser settings.'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'Camera not found. Please check your device.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera is being used by another application.'
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
        .detectSingleFace(videoRef.current)
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
      toast.success(`✅ Completed: ${updatedChallenges[index].instruction}`)

      // Small pause for user to see feedback
      await new Promise((resolve) => setTimeout(resolve, 400))
    } else {
      setChallenges(updatedChallenges)

      // All challenges completed - start countdown to capture
      toast.success('🎉 All completed! Preparing to capture...')
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
    toast.success('✅ Reference face photo captured!')
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
            <h3 className="text-2xl font-bold mb-3">Verify Real Person</h3>
            <p className="text-default-600">
              To prevent fraud, you need to perform head movements in front of the camera
            </p>
          </div>

          {/* Camera Permission Notice */}
          <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Camera className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-primary-900 mb-1">
                  📹 Camera Access Required
                </p>
                <p className="text-sm text-primary-800">
                  After clicking the button below, your browser will request camera access.
                  Please click <strong>"Allow"</strong> to continue.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-default-100 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              📋 Steps:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">1️⃣</span>
                <div>
                  <p className="font-medium">Click "Allow Camera"</p>
                  <p className="text-default-500 text-xs">
                    Browser will show permission popup
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">2️⃣</span>
                <div>
                  <p className="font-medium">Follow the movement instructions</p>
                  <p className="text-default-500 text-xs">
                    Turn left 👈, turn right 👉, look up 👆, look down 👇
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">3️⃣</span>
                <div>
                  <p className="font-medium">Return to center for capture</p>
                  <p className="text-default-500 text-xs">
                    Countdown 3-2-1 then auto capture
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 text-sm">
            <p className="font-medium text-warning-800 mb-1">⚠️ Important:</p>
            <ul className="text-warning-700 space-y-1 text-xs ml-4 list-disc">
              <li>Ensure good lighting and clear face visibility</li>
              <li>Perform movements slowly, don't rush</li>
              <li>Cannot use static images or pre-recorded videos</li>
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
              ✅ Allow Camera & Start
            </Button>
            <Button
              color="default"
              variant="light"
              size="lg"
              onPress={onCancel}
            >
              Cancel
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
          <p className="text-lg font-medium mb-2">Starting camera...</p>
          <p className="text-sm text-default-500">Please allow camera access</p>
        </CardBody>
      </Card>
    )
  }

  // Active camera screen
  return (
    <Card className="w-full">
      <CardBody className="space-y-4">
        {/* Video & Canvas with Overlay Instructions */}
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
              <div className="text-white text-9xl font-bold animate-pulse">
                {countdown}
              </div>
            </div>
          )}

          {/* Face detection indicator - top left */}
          <div className="absolute top-4 left-4 z-10">
            {faceDetected ? (
              <Chip color="success" size="sm" startContent={<CheckCircle className="h-3 w-3" />}>
                Face detected
              </Chip>
            ) : (
              <Chip color="danger" size="sm" startContent={<XCircle className="h-3 w-3" />}>
                No face
              </Chip>
            )}
          </div>

          {/* Instruction overlay - center */}
          {instruction && !countdown && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-8 py-6 text-center">
                <div className="text-7xl mb-3">{instruction.emoji}</div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  {instruction.text}
                </h3>
                {headPose && isPoseMatched(headPose.currentPose, currentChallenge.pose, headPose.confidence, 50) && (
                  <div className="mt-3">
                    <p className="text-lg font-bold text-success-400 mb-2">
                      ✅ Hold... {poseHoldProgress}%
                    </p>
                    <div className="w-64 bg-white/20 rounded-full h-2 overflow-hidden mx-auto">
                      <div
                        className="bg-success-400 h-full transition-all duration-100"
                        style={{ width: `${poseHoldProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress bar - bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
            <Progress
              value={progress}
              color="success"
              size="sm"
              aria-label="Verification progress"
              className="w-full"
            />
          </div>
        </div>

        {/* Simple action button */}
        <div className="flex justify-center">
          <Button 
            color="danger" 
            variant="flat" 
            onPress={onCancel}
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
