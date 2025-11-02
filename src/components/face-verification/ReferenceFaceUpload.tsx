'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardBody, CardHeader, Button, Image, Divider, Switch, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from '@nextui-org/react'
import { Upload, X, CheckCircle, AlertCircle, Camera, Trash2, Video } from 'lucide-react'
import { loadFaceMesh, extractLandmarksFromImage } from '@/utils/faceAnalysis'
import type { FaceLandmarks } from '@/utils/faceVerification'
import {
  uploadReferenceFace,
  getReferenceFaceInfo,
  deleteReferenceFace,
  toggleFaceVerification,
} from '@/app/actions/faceVerificationActions'
import { toast } from 'react-toastify'
import LoadingState from '@/components/LoadingState'
import LivenessCameraCapture from './LivenessCameraCapture'

interface ReferenceFaceUploadProps {
  onUploadComplete?: () => void
}

export default function ReferenceFaceUpload({ onUploadComplete }: ReferenceFaceUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [faceMesh, setFaceMesh] = useState<any>(null)
  const [hasReferenceFace, setHasReferenceFace] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [uploadedAt, setUploadedAt] = useState<Date | null>(null)
  const [useLivenessCheck, setUseLivenessCheck] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  // Load reference face info
  useEffect(() => {
    loadReferenceFaceInfo()
  }, [])

  // Load MediaPipe Face Mesh on mount
  useEffect(() => {
    const initModel = async () => {
      setIsModelLoading(true)
      try {
        const model = await loadFaceMesh()
        setFaceMesh(model)
      } catch (err) {
        console.error('Failed to load MediaPipe Face Mesh:', err)
        setError('Không thể tải mô hình AI. Vui lòng tải lại trang.')
      } finally {
        setIsModelLoading(false)
      }
    }

    initModel()
  }, [])

  const loadReferenceFaceInfo = async () => {
    try {
      const result = await getReferenceFaceInfo()
      if (result.status === 'success' && result.data) {
        setHasReferenceFace(result.data.hasReferenceFace)
        setImageUrl(result.data.referenceFaceUrl)
        setIsEnabled(result.data.isEnabled)
        setUploadedAt(result.data.uploadedAt)
      }
    } catch (error) {
      console.error('Error loading reference face info:', error)
    }
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Kích thước file phải nhỏ hơn 10MB')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng upload file ảnh')
        return
      }

      const url = URL.createObjectURL(file)
      setImageUrl(url)
      setError(null)
    }
  }

  const handleCameraCapture = (capturedImageUrl: string) => {
    setImageUrl(capturedImageUrl)
    setUseLivenessCheck(true)
    onClose()
  }

  const handleUpload = async () => {
    if (!imageUrl || !faceMesh) return

    setIsLoading(true)
    setError(null)

    try {
      // Extract landmarks from image
      const result = await extractLandmarksFromImage(imageUrl, faceMesh)

      if (!result || !result.landmarks || result.landmarks.length < 400) {
        setError(
          'Không phát hiện được khuôn mặt rõ ràng trong ảnh. Vui lòng chọn ảnh khác với khuôn mặt rõ ràng, nhìn thẳng camera.'
        )
        setIsLoading(false)
        return
      }

      // Already in FaceLandmarks format
      const landmarks: FaceLandmarks = result

      // Upload to Cloudinary first (reuse existing upload flow)
      // For now, we'll use a placeholder URL - in production, integrate with your photo upload API
      const uploadedUrl = imageUrl // TODO: Upload to Cloudinary

      // Save reference face
      const saveResult = await uploadReferenceFace(uploadedUrl, landmarks)

      if (saveResult.status === 'success') {
        const message = useLivenessCheck
          ? '✅ Đã xác thực người thật và lưu ảnh khuôn mặt mẫu!'
          : 'Đã lưu ảnh khuôn mặt mẫu thành công!'
        toast.success(message)
        setHasReferenceFace(true)
        setIsEnabled(true)
        setUploadedAt(new Date())
        if (onUploadComplete) {
          onUploadComplete()
        }
      } else {
        setError(saveResult.error || 'Lỗi khi lưu ảnh khuôn mặt mẫu')
        toast.error(saveResult.error || 'Lỗi khi lưu ảnh khuôn mặt mẫu')
      }
    } catch (err) {
      console.error('Error uploading reference face:', err)
      setError('Lỗi khi xử lý ảnh. Vui lòng thử lại.')
      toast.error('Lỗi khi xử lý ảnh')
    } finally {
      setIsLoading(false)
      setUseLivenessCheck(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa ảnh khuôn mặt mẫu? Tất cả ảnh sẽ cần xác thực lại.')) {
      return
    }

    setIsLoading(true)
    try {
      const result = await deleteReferenceFace()
      if (result.status === 'success') {
        toast.success('Đã xóa ảnh khuôn mặt mẫu')
        setImageUrl(null)
        setHasReferenceFace(false)
        setIsEnabled(false)
        setUploadedAt(null)
      } else {
        toast.error(result.error || 'Lỗi khi xóa ảnh')
      }
    } catch (error) {
      toast.error('Lỗi khi xóa ảnh khuôn mặt mẫu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleVerification = async (enabled: boolean) => {
    try {
      const result = await toggleFaceVerification(enabled)
      if (result.status === 'success') {
        setIsEnabled(enabled)
        toast.success(enabled ? 'Đã bật xác thực khuôn mặt' : 'Đã tắt xác thực khuôn mặt')
      } else {
        toast.error(result.error || 'Lỗi khi thay đổi cài đặt')
      }
    } catch (error) {
      toast.error('Lỗi khi thay đổi cài đặt xác thực')
    }
  }

  const handleRemoveImage = () => {
    setImageUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (isModelLoading) {
    return <LoadingState message="Đang tải mô hình AI..." />
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Xác thực khuôn mặt</h3>
          </div>
          {hasReferenceFace && (
            <Switch
              isSelected={isEnabled}
              onValueChange={handleToggleVerification}
              size="sm"
              color="success"
            >
              {isEnabled ? 'Đang bật' : 'Đã tắt'}
            </Switch>
          )}
        </div>
        <p className="text-sm text-default-500">
          Upload ảnh khuôn mặt mẫu để xác thực các ảnh đăng tải sau này
        </p>
      </CardHeader>
      <Divider />
      <CardBody className="gap-4">
        {/* Info about reference face */}
        {hasReferenceFace && (
          <div className="flex items-start gap-3 p-3 bg-success-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-success-700">Đã có ảnh khuôn mặt mẫu</p>
              {uploadedAt && (
                <p className="text-success-600 text-xs mt-1">
                  Tải lên: {new Date(uploadedAt).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Upload area */}
        <div className="flex flex-col gap-4">
          {imageUrl ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-default-100">
              <Image
                src={imageUrl}
                alt="Reference face"
                className="w-full h-full object-contain"
                removeWrapper
              />
              {useLivenessCheck && (
                <div className="absolute top-2 left-2">
                  <div className="bg-success text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Đã xác thực người thật
                  </div>
                </div>
              )}
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="flat"
                className="absolute top-2 right-2"
                onPress={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Upload from file */}
              <div
                className="border-2 border-dashed border-default-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-default-400" />
                <p className="text-sm font-medium mb-1">📁 Upload ảnh</p>
                <p className="text-xs text-default-400">Từ file có sẵn</p>
              </div>

              {/* Liveness camera */}
              <div
                className="border-2 border-dashed border-success-300 rounded-lg p-6 text-center cursor-pointer hover:border-success transition-colors bg-success-50"
                onClick={onOpen}
              >
                <Video className="h-10 w-10 mx-auto mb-3 text-success" />
                <p className="text-sm font-medium mb-1 text-success">📹 Chụp camera</p>
                <p className="text-xs text-success-600">Với xác thực người thật</p>
                <div className="mt-2 text-xs text-success font-semibold">✨ Khuyến nghị</div>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-3 p-3 bg-danger-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {imageUrl && !hasReferenceFace && (
            <Button
              color="primary"
              onPress={handleUpload}
              isLoading={isLoading}
              isDisabled={!faceMesh}
              className="flex-1"
            >
              {isLoading ? 'Đang xử lý...' : 'Lưu ảnh mẫu'}
            </Button>
          )}
          {hasReferenceFace && (
            <Button
              color="danger"
              variant="flat"
              startContent={<Trash2 className="h-4 w-4" />}
              onPress={handleDelete}
              isLoading={isLoading}
            >
              Xóa ảnh mẫu
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-default-500 space-y-1">
          <p className="font-medium">Lưu ý:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>✨ <strong>Khuyến nghị:</strong> Sử dụng camera với xác thực người thật</li>
            <li>Chọn ảnh rõ ràng với khuôn mặt nhìn thẳng camera</li>
            <li>Tránh ảnh mờ, tối hoặc bị che khuất</li>
            <li>Mỗi lần upload ảnh mới, hệ thống sẽ tự động xác thực với ảnh mẫu</li>
            <li>Ảnh không khớp sẽ cần được admin phê duyệt thủ công</li>
          </ul>
        </div>
      </CardBody>

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
              onCaptureComplete={handleCameraCapture}
              onCancel={onClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Card>
  )
}
