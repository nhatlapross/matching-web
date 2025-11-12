'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Image,
  Divider,
  Spinner,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@nextui-org/react'
import { getPhotosVerificationStatus } from '@/app/actions/faceVerificationActions'
import PhotoVerificationBadge from './PhotoVerificationBadge'
import { ImageIcon, RefreshCw } from 'lucide-react'
import { toast } from 'react-toastify'

interface PhotoWithVerification {
  id: string
  url: string
  faceVerified: boolean
  faceVerificationScore: number | null
  verifiedAt: Date | null
  isApproved: boolean
}

export default function PhotoVerificationList() {
  const [photos, setPhotos] = useState<PhotoWithVerification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithVerification | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    setIsLoading(true)
    try {
      const result = await getPhotosVerificationStatus()
      if (result.status === 'success' && result.data) {
        setPhotos(result.data)
      } else {
        const errorMsg = 'error' in result 
          ? (typeof result.error === 'string' ? result.error : 'Lỗi khi tải danh sách ảnh')
          : 'Lỗi khi tải danh sách ảnh'
        toast.error(errorMsg)
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách ảnh')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoClick = (photo: PhotoWithVerification) => {
    setSelectedPhoto(photo)
    onOpen()
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardBody className="flex items-center justify-center py-8">
          <Spinner size="lg" />
          <p className="text-sm text-default-500 mt-4">Đang tải danh sách ảnh...</p>
        </CardBody>
      </Card>
    )
  }

  if (photos.length === 0) {
    return (
      <Card className="w-full">
        <CardBody className="flex flex-col items-center justify-center py-8 gap-3">
          <ImageIcon className="h-12 w-12 text-default-300" />
          <p className="text-sm text-default-500">Chưa có ảnh nào</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold">Danh sách ảnh</h3>
            <p className="text-sm text-default-500">{photos.length} ảnh</p>
          </div>
          <Button
            size="sm"
            variant="flat"
            startContent={<RefreshCw className="h-4 w-4" />}
            onPress={loadPhotos}
          >
            Làm mới
          </Button>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => handlePhotoClick(photo)}
              >
                <Image
                  src={photo.url}
                  alt="Photo"
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  removeWrapper
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1">
                  <PhotoVerificationBadge
                    faceVerified={photo.faceVerified}
                    faceVerificationScore={photo.faceVerificationScore}
                    verifiedAt={photo.verifiedAt}
                    size="sm"
                  />
                  {!photo.isApproved && (
                    <div className="text-xs text-warning bg-warning/10 px-2 py-1 rounded">
                      Chưa duyệt
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Chi tiết ảnh</ModalHeader>
              <ModalBody>
                {selectedPhoto && (
                  <div className="flex flex-col gap-4">
                    <Image
                      src={selectedPhoto.url}
                      alt="Photo"
                      className="w-full rounded-lg"
                    />
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Trạng thái xác thực:</p>
                        <PhotoVerificationBadge
                          faceVerified={selectedPhoto.faceVerified}
                          faceVerificationScore={selectedPhoto.faceVerificationScore}
                          verifiedAt={selectedPhoto.verifiedAt}
                          showScore
                          size="md"
                        />
                      </div>
                      {selectedPhoto.verifiedAt && (
                        <div>
                          <p className="text-sm font-medium mb-1">Thời gian xác thực:</p>
                          <p className="text-sm text-default-600">
                            {new Date(selectedPhoto.verifiedAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium mb-1">Trạng thái phê duyệt:</p>
                        <p className="text-sm text-default-600">
                          {selectedPhoto.isApproved ? (
                            <span className="text-success">Đã phê duyệt</span>
                          ) : (
                            <span className="text-warning">Chờ phê duyệt</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Đóng
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
