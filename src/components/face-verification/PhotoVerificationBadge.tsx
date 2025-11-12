'use client'

import { Chip, Tooltip } from '@nextui-org/react'
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'

interface PhotoVerificationBadgeProps {
  faceVerified: boolean
  faceVerificationScore: number | null
  verifiedAt: Date | null
  size?: 'sm' | 'md' | 'lg'
  showScore?: boolean
}

export default function PhotoVerificationBadge({
  faceVerified,
  faceVerificationScore,
  verifiedAt,
  size = 'sm',
  showScore = false,
}: PhotoVerificationBadgeProps) {
  // Determine badge appearance based on verification result
  const getBadgeConfig = () => {
    if (!verifiedAt) {
      return {
        color: 'default' as const,
        icon: <Clock className="h-3 w-3" />,
        label: 'Chưa xác thực',
        tooltip: 'Ảnh chưa được xác thực khuôn mặt',
      }
    }

    if (faceVerified && faceVerificationScore !== null) {
      if (faceVerificationScore >= 85) {
        return {
          color: 'success' as const,
          icon: <CheckCircle className="h-3 w-3" />,
          label: showScore ? `Đã xác thực (${faceVerificationScore}%)` : 'Đã xác thực',
          tooltip: `Khuôn mặt khớp với độ tin cậy cao (${faceVerificationScore}%)`,
        }
      } else if (faceVerificationScore >= 70) {
        return {
          color: 'warning' as const,
          icon: <AlertTriangle className="h-3 w-3" />,
          label: showScore ? `Cảnh báo (${faceVerificationScore}%)` : 'Cảnh báo',
          tooltip: `Khuôn mặt khớp nhưng độ tin cậy trung bình (${faceVerificationScore}%)`,
        }
      }
    }

    return {
      color: 'danger' as const,
      icon: <XCircle className="h-3 w-3" />,
      label: 'Không khớp',
      tooltip: 'Khuôn mặt không khớp với ảnh mẫu',
    }
  }

  const config = getBadgeConfig()

  return (
    <Tooltip content={config.tooltip}>
      <Chip
        color={config.color}
        variant="flat"
        size={size}
        startContent={config.icon}
        className="cursor-help"
      >
        {config.label}
      </Chip>
    </Tooltip>
  )
}
