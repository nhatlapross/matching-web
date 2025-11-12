'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  compareFaceLandmarks,
  validateLandmarks,
} from '@/utils/faceVerification'
import type { FaceLandmarks, FaceVerificationResult } from '@/utils/faceVerification'
import type { ActionResult } from '@/types'

/**
 * Upload và lưu reference face (ảnh khuôn mặt mẫu)
 */
export async function uploadReferenceFace(
  imageUrl: string,
  landmarks: FaceLandmarks
): Promise<ActionResult<{ success: boolean; message: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { status: 'error', error: 'Unauthorized' }
    }

    // Validate landmarks
    if (!validateLandmarks(landmarks)) {
      return { status: 'error', error: 'Invalid landmarks data' }
    }

    // Validate có phát hiện được khuôn mặt không
    if (!landmarks.landmarks || landmarks.landmarks.length < 400) {
      return {
        status: 'error',
        error: 'Không phát hiện được khuôn mặt rõ ràng trong ảnh. Vui lòng chọn ảnh khác.',
      }
    }

    // Update member với reference face
    const member = await prisma.member.findUnique({
      where: { userId: session.user.id },
    })

    if (!member) {
      return { status: 'error', error: 'Member not found' }
    }

    await prisma.member.update({
      where: { id: member.id },
      data: {
        referenceFaceUrl: imageUrl,
        referenceFaceLandmarks: landmarks as any,
        faceVerificationEnabled: true,
        referenceFaceUploadedAt: new Date(),
      },
    })

    return {
      status: 'success',
      data: {
        success: true,
        message: 'Đã lưu ảnh khuôn mặt mẫu thành công',
      },
    }
  } catch (error) {
    console.error('Error uploading reference face:', error)
    return {
      status: 'error',
      error: 'Lỗi khi lưu ảnh khuôn mặt mẫu',
    }
  }
}

/**
 * Xác thực một photo với reference face
 */
export async function verifyPhotoWithReferenceFace(
  photoId: string,
  photoLandmarks: FaceLandmarks
): Promise<ActionResult<FaceVerificationResult>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { status: 'error', error: 'Unauthorized' }
    }

    // Get member's reference face
    const member = await prisma.member.findUnique({
      where: { userId: session.user.id },
      select: {
        referenceFaceLandmarks: true,
        faceVerificationEnabled: true,
      },
    })

    if (!member) {
      return { status: 'error', error: 'Member not found' }
    }

    if (!member.faceVerificationEnabled) {
      return {
        status: 'error',
        error: 'Face verification chưa được bật. Vui lòng upload ảnh khuôn mặt mẫu trước.',
      }
    }

    if (!member.referenceFaceLandmarks) {
      return {
        status: 'error',
        error: 'Chưa có ảnh khuôn mặt mẫu. Vui lòng upload trước.',
      }
    }

    // Validate landmarks
    if (!validateLandmarks(photoLandmarks)) {
      return { status: 'error', error: 'Invalid landmarks data' }
    }

    // Compare faces
    const referenceLandmarks = member.referenceFaceLandmarks as unknown as FaceLandmarks
    const result = compareFaceLandmarks(referenceLandmarks, photoLandmarks)

    // Update photo với verification result
    await prisma.photo.update({
      where: { id: photoId },
      data: {
        faceVerified: result.isMatch,
        faceVerificationScore: result.similarityScore,
        faceLandmarks: photoLandmarks as any,
        verifiedAt: new Date(),
      },
    })

    return {
      status: 'success',
      data: result,
    }
  } catch (error) {
    console.error('Error verifying photo:', error)
    return {
      status: 'error',
      error: 'Lỗi khi xác thực ảnh',
    }
  }
}

/**
 * Get reference face info
 */
export async function getReferenceFaceInfo(): Promise<
  ActionResult<{
    hasReferenceFace: boolean
    referenceFaceUrl: string | null
    isEnabled: boolean
    uploadedAt: Date | null
  }>
> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { status: 'error', error: 'Unauthorized' }
    }

    const member = await prisma.member.findUnique({
      where: { userId: session.user.id },
      select: {
        referenceFaceUrl: true,
        faceVerificationEnabled: true,
        referenceFaceUploadedAt: true,
      },
    })

    if (!member) {
      return { status: 'error', error: 'Member not found' }
    }

    return {
      status: 'success',
      data: {
        hasReferenceFace: !!member.referenceFaceUrl,
        referenceFaceUrl: member.referenceFaceUrl,
        isEnabled: member.faceVerificationEnabled,
        uploadedAt: member.referenceFaceUploadedAt,
      },
    }
  } catch (error) {
    console.error('Error getting reference face info:', error)
    return {
      status: 'error',
      error: 'Lỗi khi lấy thông tin ảnh khuôn mặt mẫu',
    }
  }
}

/**
 * Toggle face verification on/off
 */
export async function toggleFaceVerification(
  enabled: boolean
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { status: 'error', error: 'Unauthorized' }
    }

    const member = await prisma.member.findUnique({
      where: { userId: session.user.id },
    })

    if (!member) {
      return { status: 'error', error: 'Member not found' }
    }

    // Nếu bật verification nhưng chưa có reference face
    if (enabled && !member.referenceFaceUrl) {
      return {
        status: 'error',
        error: 'Vui lòng upload ảnh khuôn mặt mẫu trước khi bật xác thực',
      }
    }

    await prisma.member.update({
      where: { id: member.id },
      data: {
        faceVerificationEnabled: enabled,
      },
    })

    return {
      status: 'success',
      data: { success: true },
    }
  } catch (error) {
    console.error('Error toggling face verification:', error)
    return {
      status: 'error',
      error: 'Lỗi khi thay đổi cài đặt xác thực khuôn mặt',
    }
  }
}

/**
 * Delete reference face
 */
export async function deleteReferenceFace(): Promise<ActionResult<{ success: boolean }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { status: 'error', error: 'Unauthorized' }
    }

    const member = await prisma.member.findUnique({
      where: { userId: session.user.id },
    })

    if (!member) {
      return { status: 'error', error: 'Member not found' }
    }

    await prisma.member.update({
      where: { id: member.id },
      data: {
        referenceFaceUrl: null,
        referenceFaceLandmarks: Prisma.JsonNull,
        faceVerificationEnabled: false,
        referenceFaceUploadedAt: null,
      },
    })

    return {
      status: 'success',
      data: { success: true },
    }
  } catch (error) {
    console.error('Error deleting reference face:', error)
    return {
      status: 'error',
      error: 'Lỗi khi xóa ảnh khuôn mặt mẫu',
    }
  }
}

/**
 * Get all photos with their verification status
 */
export async function getPhotosVerificationStatus(): Promise<
  ActionResult<
    Array<{
      id: string
      url: string
      faceVerified: boolean
      faceVerificationScore: number | null
      verifiedAt: Date | null
      isApproved: boolean
    }>
  >
> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { status: 'error', error: 'Unauthorized' }
    }

    const member = await prisma.member.findUnique({
      where: { userId: session.user.id },
      include: {
        photos: {
          select: {
            id: true,
            url: true,
            faceVerified: true,
            faceVerificationScore: true,
            verifiedAt: true,
            isApproved: true,
          },
          orderBy: {
            verifiedAt: 'desc',
          },
        },
      },
    })

    if (!member) {
      return { status: 'error', error: 'Member not found' }
    }

    return {
      status: 'success',
      data: member.photos,
    }
  } catch (error) {
    console.error('Error getting photos verification status:', error)
    return {
      status: 'error',
      error: 'Lỗi khi lấy trạng thái xác thực ảnh',
    }
  }
}
