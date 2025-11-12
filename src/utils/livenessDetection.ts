/**
 * Liveness Detection Utilities
 * Phát hiện người thật bằng cách yêu cầu thực hiện các chuyển động đầu
 */

export type HeadPose = 'center' | 'left' | 'right' | 'up' | 'down'

export interface LivenessChallenge {
  pose: HeadPose
  instruction: string
  completed: boolean
}

export interface HeadPoseResult {
  currentPose: HeadPose
  confidence: number
  pitch: number // Nghiêng trên/dưới (-30 đến 30 độ)
  yaw: number   // Quay trái/phải (-30 đến 30 độ)
  roll: number  // Nghiêng vai (-30 đến 30 độ)
}

/**
 * Calculate head pose từ facial landmarks (68 points)
 * Reference: https://www.learnopencv.com/head-pose-estimation-using-opencv-and-dlib/
 */
export function calculateHeadPose(landmarks: any): HeadPoseResult {
  // Key landmark indices (face-api.js 68-point model)
  const noseTip = landmarks.getNose()[3] // Index 33
  const leftEye = landmarks.getLeftEye()[0] // Index 36
  const rightEye = landmarks.getRightEye()[3] // Index 45
  const leftMouth = landmarks.getMouth()[0] // Index 48
  const rightMouth = landmarks.getMouth()[6] // Index 54
  const chin = landmarks.getJawOutline()[8] // Index 8

  // Calculate horizontal position (yaw - quay trái/phải)
  const eyeDistance = rightEye.x - leftEye.x
  const noseToLeftEye = noseTip.x - leftEye.x
  const noseToRightEye = rightEye.x - noseTip.x

  // Yaw: positive = quay phải, negative = quay trái
  const yaw = ((noseToLeftEye - noseToRightEye) / eyeDistance) * 30

  // Calculate vertical position (pitch - nghiêng trên/dưới)
  const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 }
  const mouthCenter = { x: (leftMouth.x + rightMouth.x) / 2, y: (leftMouth.y + rightMouth.y) / 2 }
  const faceHeight = chin.y - eyeCenter.y
  const noseVerticalOffset = noseTip.y - eyeCenter.y

  // Pitch: positive = nhìn xuống, negative = nhìn lên
  const pitch = ((noseVerticalOffset - faceHeight * 0.3) / faceHeight) * 60

  // Calculate roll (nghiêng vai - ít dùng trong liveness)
  const eyeAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x)
  const roll = (eyeAngle * 180) / Math.PI

  // Determine current pose
  let currentPose: HeadPose = 'center'
  let confidence = 0

  // Thresholds dễ hơn để user dễ thực hiện
  const YAW_THRESHOLD = 8 // Giảm từ 12 xuống 8 độ
  const PITCH_THRESHOLD = 8 // Giảm từ 10 xuống 8 độ

  // Check yaw (trái/phải) trước vì dễ thực hiện hơn
  // Mirror camera: swap left/right để match với user perspective
  if (Math.abs(yaw) > YAW_THRESHOLD) {
    currentPose = yaw > 0 ? 'left' : 'right' // Swapped for mirror camera
    confidence = Math.min(100, (Math.abs(yaw) / YAW_THRESHOLD) * 50 + 50)
  }
  // Check pitch (trên/dưới)
  else if (Math.abs(pitch) > PITCH_THRESHOLD) {
    currentPose = pitch > 0 ? 'down' : 'up'
    confidence = Math.min(100, (Math.abs(pitch) / PITCH_THRESHOLD) * 50 + 50)
  }
  // Center - threshold nhỏ hơn
  else if (Math.abs(yaw) < 5 && Math.abs(pitch) < 5) {
    currentPose = 'center'
    confidence = Math.max(0, 100 - (Math.abs(yaw) + Math.abs(pitch)) * 8)
  }
  // Transitional state
  else {
    currentPose = 'center'
    confidence = 30 // Low confidence center
  }

  return {
    currentPose,
    confidence: Math.round(confidence),
    pitch: Math.round(pitch * 10) / 10,
    yaw: Math.round(yaw * 10) / 10,
    roll: Math.round(roll * 10) / 10,
  }
}

/**
 * Generate liveness challenges (các bước cần thực hiện)
 */
export function generateLivenessChallenges(): LivenessChallenge[] {
  return [
    {
      pose: 'left',
      instruction: '👈 Turn head to the LEFT',
      completed: false,
    },
    {
      pose: 'right',
      instruction: '👉 Turn head to the RIGHT',
      completed: false,
    },
    {
      pose: 'up',
      instruction: '👆 Look UP',
      completed: false,
    },
    {
      pose: 'down',
      instruction: '👇 Look DOWN',
      completed: false,
    },
    {
      pose: 'center',
      instruction: '📸 Return to CENTER to capture',
      completed: false,
    },
  ]
}

/**
 * Check if current pose matches required pose
 */
export function isPoseMatched(
  currentPose: HeadPose,
  requiredPose: HeadPose,
  confidence: number,
  minConfidence: number = 60
): boolean {
  return currentPose === requiredPose && confidence >= minConfidence
}

/**
 * Format instruction with emoji and color
 */
export function formatPoseInstruction(pose: HeadPose): {
  emoji: string
  text: string
  color: string
} {
  const instructions = {
    left: { emoji: '👈', text: 'Turn head to the LEFT', color: 'primary' },
    right: { emoji: '👉', text: 'Turn head to the RIGHT', color: 'primary' },
    up: { emoji: '👆', text: 'Look UP', color: 'primary' },
    down: { emoji: '👇', text: 'Look DOWN', color: 'primary' },
    center: { emoji: '📸', text: 'Return to CENTER to capture', color: 'success' },
  }

  return instructions[pose]
}

/**
 * Validate liveness session
 * Kiểm tra user đã hoàn thành đủ challenges chưa
 */
export function validateLivenessSession(challenges: LivenessChallenge[]): boolean {
  return challenges.every((challenge) => challenge.completed)
}
