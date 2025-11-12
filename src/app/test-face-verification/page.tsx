'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardBody, CardHeader, Button, Image, Divider, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from '@nextui-org/react'
import { Upload, CheckCircle, XCircle, AlertCircle, Video, X } from 'lucide-react'
import { extractFaceDescriptor, compareFaceDescriptors } from '@/utils/faceVerification'
import type { FaceDescriptor } from '@/utils/faceVerification'
import LivenessCameraCapture from '@/components/face-verification/LivenessCameraCapture'
import { toast } from 'react-toastify'

export default function TestFaceVerificationPage() {
  const [isLoadingModel, setIsLoadingModel] = useState(true)

  // Reference face (ảnh mẫu)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceDescriptor, setReferenceDescriptor] = useState<FaceDescriptor | null>(null)
  const [isProcessingReference, setIsProcessingReference] = useState(false)
  const [referenceLivenessVerified, setReferenceLivenessVerified] = useState(false)

  // Test photo (ảnh cần verify)
  const [testImage, setTestImage] = useState<string | null>(null)
  const [testDescriptor, setTestDescriptor] = useState<FaceDescriptor | null>(null)
  const [isProcessingTest, setIsProcessingTest] = useState(false)

  // Verification result
  const [verificationResult, setVerificationResult] = useState<any>(null)

  const referenceInputRef = useRef<HTMLInputElement>(null)
  const testInputRef = useRef<HTMLInputElement>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [cameraKey, setCameraKey] = useState(0) // Key to force remount camera component

  // Load face-api.js models
  useEffect(() => {
    const initModels = async () => {
      try {
        const faceapi = await import('face-api.js')
        const MODEL_URL = '/models'
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])
        toast.success('✅ Đã tải mô hình FaceNet thành công')
      } catch (err) {
        console.error('Failed to load models:', err)
        toast.error('Lỗi khi tải mô hình AI')
      } finally {
        setIsLoadingModel(false)
      }
    }
    initModels()
  }, [])

  const handleCameraCapture = async (capturedImageUrl: string) => {
    setReferenceImage(capturedImageUrl)
    setReferenceLivenessVerified(true)
    setIsProcessingReference(true)
    setVerificationResult(null)
    setCameraKey((prev) => prev + 1) // Force remount on next open
    onClose()

    try {
      const descriptor = await extractFaceDescriptor(capturedImageUrl)
      if (descriptor) {
        setReferenceDescriptor(descriptor)
        toast.success('✅ Đã xác thực người thật và phát hiện khuôn mặt!')
      } else {
        toast.error('❌ Không phát hiện được khuôn mặt rõ ràng')
        setReferenceDescriptor(null)
        setReferenceLivenessVerified(false)
      }
    } catch (error) {
      console.error('Error processing reference:', error)
      toast.error('Lỗi khi xử lý ảnh mẫu')
      setReferenceLivenessVerified(false)
    } finally {
      setIsProcessingReference(false)
    }
  }

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setReferenceImage(url)
    setReferenceLivenessVerified(false)
    setIsProcessingReference(true)
    setVerificationResult(null)

    try {
      const descriptor = await extractFaceDescriptor(url)
      if (descriptor) {
        setReferenceDescriptor(descriptor)
        toast.success('✅ Đã phát hiện khuôn mặt mẫu')
      } else {
        toast.error('❌ Không phát hiện được khuôn mặt rõ ràng')
        setReferenceDescriptor(null)
      }
    } catch (error) {
      console.error('Error processing reference:', error)
      toast.error('Lỗi khi xử lý ảnh mẫu')
    } finally {
      setIsProcessingReference(false)
    }
  }

  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setTestImage(url)
    setIsProcessingTest(true)
    setVerificationResult(null)

    try {
      const descriptor = await extractFaceDescriptor(url)
      if (descriptor) {
        setTestDescriptor(descriptor)
        toast.success('✅ Đã phát hiện khuôn mặt trong ảnh test')
      } else {
        toast.error('❌ Không phát hiện được khuôn mặt rõ ràng')
        setTestDescriptor(null)
      }
    } catch (error) {
      console.error('Error processing test image:', error)
      toast.error('Lỗi khi xử lý ảnh test')
    } finally {
      setIsProcessingTest(false)
    }
  }

  const handleVerify = async () => {
    if (!referenceDescriptor || !testDescriptor) {
      toast.error('Vui lòng upload cả 2 ảnh trước')
      return
    }

    const result = await compareFaceDescriptors(referenceDescriptor, testDescriptor)
    setVerificationResult(result)

    if (result.isMatch) {
      toast.success(`✅ Khớp! Distance: ${result.distance?.toFixed(3)}`)
    } else {
      toast.error(`❌ Không khớp! Distance: ${result.distance?.toFixed(3)}`)
    }
  }

  const handleRemoveReference = () => {
    setReferenceImage(null)
    setReferenceDescriptor(null)
    setReferenceLivenessVerified(false)
    setVerificationResult(null)
    if (referenceInputRef.current) referenceInputRef.current.value = ''
  }

  const handleRemoveTest = () => {
    setTestImage(null)
    setTestDescriptor(null)
    setVerificationResult(null)
    if (testInputRef.current) testInputRef.current.value = ''
  }

  const handleReset = () => {
    handleRemoveReference()
    handleRemoveTest()
  }

  if (isLoadingModel) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Card>
          <CardBody className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Đang tải mô hình AI...</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧪 Test Face Verification</h1>
        <p className="text-default-600">Upload 2 ảnh để test xác thực khuôn mặt</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Reference Face */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold">1️⃣ Ảnh khuôn mặt mẫu (Reference)</h3>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            {referenceImage ? (
              <div className="relative">
                <Image src={referenceImage} alt="Reference" className="w-full rounded-lg" />
                {referenceLivenessVerified && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className="bg-success text-white text-xs px-2 py-1 rounded flex items-center gap-1 shadow-lg">
                      <CheckCircle className="h-3 w-3" />
                      Đã xác thực người thật
                    </div>
                  </div>
                )}
                <Button
                  isIconOnly
                  size="sm"
                  color="danger"
                  variant="solid"
                  className="absolute top-2 right-2 z-10 shadow-lg"
                  onPress={handleRemoveReference}
                >
                  <X className="h-4 w-4" />
                </Button>
                {referenceDescriptor && (
                  <div className="absolute bottom-2 right-2 z-10">
                    <CheckCircle className="h-6 w-6 text-success bg-white rounded-full shadow-lg" />
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="border-2 border-dashed border-default-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => referenceInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 mx-auto mb-2 text-default-400" />
                  <p className="text-xs font-medium">📁 Upload file</p>
                </div>
                <div
                  className="border-2 border-dashed border-success-300 rounded-lg p-6 text-center cursor-pointer hover:border-success transition-colors bg-success-50"
                  onClick={onOpen}
                >
                  <Video className="h-10 w-10 mx-auto mb-2 text-success" />
                  <p className="text-xs font-medium text-success">📹 Chụp camera</p>
                  <p className="text-[10px] text-success-600 mt-1">✨ Khuyến nghị</p>
                </div>
              </div>
            )}
            <input
              ref={referenceInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleReferenceUpload}
            />
            {isProcessingReference && (
              <p className="text-sm text-primary">Đang xử lý với FaceNet...</p>
            )}
            {referenceDescriptor && (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle className="h-4 w-4" />
                Đã trích xuất descriptor (128 dimensions)
              </div>
            )}
          </CardBody>
        </Card>

        {/* Test Photo */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold">2️⃣ Ảnh cần xác thực (Test)</h3>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            {testImage ? (
              <div className="relative">
                <Image src={testImage} alt="Test" className="w-full rounded-lg" />
                <Button
                  isIconOnly
                  size="sm"
                  color="danger"
                  variant="solid"
                  className="absolute top-2 right-2 z-10 shadow-lg"
                  onPress={handleRemoveTest}
                >
                  <X className="h-4 w-4" />
                </Button>
                {testDescriptor && (
                  <div className="absolute bottom-2 right-2 z-10">
                    <CheckCircle className="h-6 w-6 text-success bg-white rounded-full shadow-lg" />
                  </div>
                )}
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-default-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => testInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-2 text-default-400" />
                <p className="text-sm">Click để chọn ảnh test</p>
              </div>
            )}
            <input
              ref={testInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleTestUpload}
            />
            {isProcessingTest && (
              <p className="text-sm text-primary">Đang xử lý với FaceNet...</p>
            )}
            {testDescriptor && (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle className="h-4 w-4" />
                Đã trích xuất descriptor (128 dimensions)
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center mb-6">
        <Button
          color="primary"
          size="lg"
          onPress={handleVerify}
          isDisabled={!referenceDescriptor || !testDescriptor}
        >
          🔍 So sánh khuôn mặt
        </Button>
        <Button
          color="default"
          variant="flat"
          size="lg"
          onPress={handleReset}
        >
          🔄 Reset
        </Button>
      </div>

      {/* Verification Result */}
      {verificationResult && (
        <Card
          className={
            verificationResult.isMatch
              ? 'bg-success-50 border-2 border-success'
              : 'bg-danger-50 border-2 border-danger'
          }
        >
          <CardBody className="text-center py-8">
            <div className="mb-4">
              {verificationResult.isMatch ? (
                <CheckCircle className="h-16 w-16 text-success mx-auto" />
              ) : (
                <XCircle className="h-16 w-16 text-danger mx-auto" />
              )}
            </div>
            <h3 className="text-2xl font-bold mb-2">
              {verificationResult.isMatch ? '✅ Khuôn mặt khớp!' : '❌ Khuôn mặt không khớp!'}
            </h3>
            <p className="text-lg mb-4">
              Euclidean Distance: <strong>{verificationResult.distance?.toFixed(3)}</strong>
            </p>
            <p className="text-md mb-2">
              Similarity Score: <strong>{verificationResult.similarityScore}%</strong>
            </p>
            <p className="text-sm mb-2">
              Độ tin cậy:{' '}
              <strong>
                {verificationResult.confidence === 'high'
                  ? '🟢 Cao'
                  : verificationResult.confidence === 'medium'
                  ? '🟡 Trung bình'
                  : '🔴 Thấp'}
              </strong>
            </p>
            <p className="text-sm text-default-600">{verificationResult.message}</p>

            {/* Detailed Info */}
            <Divider className="my-4" />
            <div className="text-left text-xs text-default-500 space-y-1">
              <p>📊 Chi tiết kỹ thuật (FaceNet):</p>
              <ul className="list-disc list-inside ml-4">
                <li><strong>Distance &lt; 0.45:</strong> ✅ Cùng người (ACCEPT)</li>
                <li><strong>Distance 0.45 - 0.55:</strong> ⚠️ Không chắc (REJECT)</li>
                <li><strong>Distance &gt; 0.55:</strong> ❌ Khác người (REJECT)</li>
                <li>Model: FaceNet với 128-dimensional face embeddings</li>
                <li>Độ chính xác: ~99.63% trên LFW dataset</li>
                <li>Threshold conservative để tránh false positive</li>
              </ul>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <h3 className="font-semibold">📖 Hướng dẫn</h3>
        </CardHeader>
        <Divider />
        <CardBody className="text-sm space-y-2">
          <p><strong>Bước 1:</strong> Upload ảnh khuôn mặt mẫu (ảnh reference)</p>
          <p><strong>Bước 2:</strong> Upload ảnh cần xác thực (ảnh test)</p>
          <p><strong>Bước 3:</strong> Click "So sánh khuôn mặt" để xem kết quả</p>
          <Divider className="my-3" />
          <p><strong>💡 Tips:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Dùng ảnh rõ ràng, khuôn mặt nhìn thẳng camera</li>
            <li>Tránh ảnh mờ, tối hoặc bị che khuất</li>
            <li>Test với cùng người → distance &lt; 0.45 ✅</li>
            <li>Test với người khác → distance &gt; 0.55 ❌</li>
            <li>Distance 0.45-0.55 → Từ chối để an toàn ⚠️</li>
            <li>Công nghệ: FaceNet - chuẩn công nghiệp cho face verification</li>
          </ul>
        </CardBody>
      </Card>

      {/* Liveness Camera Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="3xl"
        closeButton
        isDismissable={false}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-success" />
              <span>Xác thực người thật & Chụp ảnh mẫu</span>
            </div>
          </ModalHeader>
          <ModalBody className="pb-6">
            <LivenessCameraCapture
              key={cameraKey}
              onCaptureComplete={handleCameraCapture}
              onCancel={onClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  )
}
