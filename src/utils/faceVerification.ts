/**
 * Face Verification Utilities
 * Sử dụng face-api.js với FaceNet model cho face recognition chính xác
 */

export interface FaceLandmarks {
  landmarks: { x: number; y: number; z: number }[]
}

export interface FaceDescriptor {
  descriptor: Float32Array // 128-dimensional face descriptor from FaceNet
}

export interface FaceVerificationResult {
  isMatch: boolean
  similarityScore: number // 0-100
  confidence: 'high' | 'medium' | 'low'
  message: string
  distance?: number // Euclidean distance between descriptors
}

/**
 * Ngưỡng cho face verification score (0-100)
 * Dựa trên combined score từ facial ratios, cosine similarity, và euclidean distance
 */
const VERIFICATION_THRESHOLDS = {
  HIGH: 75,      // High confidence match
  MEDIUM: 60,    // Medium confidence match
  MIN: 50,       // Minimum threshold for potential match
}

/**
 * Ngưỡng Euclidean distance cho face-api.js FaceNet descriptors
 * Dựa trên research và best practices:
 * - < 0.45: Chắc chắn cùng người (HIGH confidence)
 * - 0.45 - 0.55: Nghi ngờ, cần xem xét (MEDIUM - reject để an toàn)
 * - > 0.55: Chắc chắn khác người (LOW)
 */
const FACENET_THRESHOLDS = {
  HIGH: 0.45,     // Accept: Very confident same person
  MEDIUM: 0.55,   // Reject: Too risky, might be different person
}

/**
 * Load face-api.js models nếu chưa load
 */
async function loadFaceApiModels() {
  const faceapi = await import('face-api.js')

  const MODEL_URL = '/models'
  const modelsToLoad = []

  // Check each model individually
  if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
    modelsToLoad.push(faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL))
  }
  if (!faceapi.nets.faceLandmark68Net.isLoaded) {
    modelsToLoad.push(faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL))
  }
  if (!faceapi.nets.faceRecognitionNet.isLoaded) {
    modelsToLoad.push(faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL))
  }

  if (modelsToLoad.length > 0) {
    await Promise.all(modelsToLoad)
  }

  return faceapi
}

/**
 * Chuẩn hóa landmarks về tọa độ tương đối
 * Điều này giúp so sánh khuôn mặt không phụ thuộc vào kích thước và vị trí ảnh
 */
function normalizeLandmarks(landmarks: { x: number; y: number; z: number }[]): number[][] {
  if (!landmarks || landmarks.length === 0) {
    return []
  }

  // Tính center point
  const centerX = landmarks.reduce((sum, p) => sum + p.x, 0) / landmarks.length
  const centerY = landmarks.reduce((sum, p) => sum + p.y, 0) / landmarks.length
  const centerZ = landmarks.reduce((sum, p) => sum + p.z, 0) / landmarks.length

  // Tính scale (khoảng cách trung bình từ center)
  const distances = landmarks.map((p) =>
    Math.sqrt(
      Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2) + Math.pow(p.z - centerZ, 2)
    )
  )
  const scale = distances.reduce((sum, d) => sum + d, 0) / distances.length

  // Normalize
  return landmarks.map((p) => [
    (p.x - centerX) / scale,
    (p.y - centerY) / scale,
    (p.z - centerZ) / scale,
  ])
}

/**
 * Tính cosine similarity giữa 2 vectors
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length || vec1.length === 0) {
    return 0
  }

  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i]
    norm1 += vec1[i] * vec1[i]
    norm2 += vec2[i] * vec2[i]
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2)
  if (denominator === 0) return 0

  return dotProduct / denominator
}

/**
 * Tính Euclidean distance giữa 2 vectors
 */
function euclideanDistance(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length || vec1.length === 0) {
    return Infinity
  }

  let sum = 0
  for (let i = 0; i < vec1.length; i++) {
    sum += Math.pow(vec1[i] - vec2[i], 2)
  }

  return Math.sqrt(sum)
}

/**
 * Extract key facial landmarks cho so sánh nhanh hơn
 * Chỉ lấy các điểm quan trọng thay vì cả 468 điểm
 */
function extractKeyLandmarks(
  landmarks: { x: number; y: number; z: number }[]
): { x: number; y: number; z: number }[] {
  // MediaPipe Face Mesh key indices:
  // Contour: 10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
  // Eyes: 33, 133, 362, 263
  // Nose: 1, 4, 5, 195, 197
  // Mouth: 61, 291, 0, 17, 39, 269

  const keyIndices = [
    // Face contour (16 points)
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 234, 127, 162, 21,
    // Eyes (8 points)
    33, 133, 159, 145, 362, 263, 386, 374,
    // Eyebrows (8 points)
    70, 63, 105, 66, 300, 293, 334, 296,
    // Nose (8 points)
    1, 4, 5, 195, 197, 6, 168, 8,
    // Mouth (12 points)
    61, 291, 0, 17, 39, 269, 78, 308, 13, 14, 87, 317,
    // Jaw (8 points)
    172, 58, 132, 93, 397, 365, 379, 378,
  ]

  return keyIndices
    .filter((idx) => idx < landmarks.length)
    .map((idx) => landmarks[idx])
}

/**
 * Calculate facial feature ratios for more distinctive comparison
 */
function calculateFacialRatios(landmarks: { x: number; y: number; z: number }[]): number[] {
  // Key landmark indices
  const leftEyeLeft = landmarks[33]
  const leftEyeRight = landmarks[133]
  const rightEyeLeft = landmarks[362]
  const rightEyeRight = landmarks[263]
  const noseTip = landmarks[1]
  const noseBottom = landmarks[2]
  const mouthLeft = landmarks[61]
  const mouthRight = landmarks[291]
  const chinBottom = landmarks[152]
  const foreheadTop = landmarks[10]
  const jawLeft = landmarks[234]
  const jawRight = landmarks[454]

  // Calculate distances
  const leftEyeWidth = Math.sqrt(
    Math.pow(leftEyeRight.x - leftEyeLeft.x, 2) + Math.pow(leftEyeRight.y - leftEyeLeft.y, 2)
  )
  const rightEyeWidth = Math.sqrt(
    Math.pow(rightEyeRight.x - rightEyeLeft.x, 2) + Math.pow(rightEyeRight.y - rightEyeLeft.y, 2)
  )
  const eyeDistance = Math.sqrt(
    Math.pow(rightEyeLeft.x - leftEyeRight.x, 2) + Math.pow(rightEyeLeft.y - leftEyeRight.y, 2)
  )
  const noseLength = Math.sqrt(
    Math.pow(noseBottom.x - noseTip.x, 2) + Math.pow(noseBottom.y - noseTip.y, 2)
  )
  const mouthWidth = Math.sqrt(
    Math.pow(mouthRight.x - mouthLeft.x, 2) + Math.pow(mouthRight.y - mouthLeft.y, 2)
  )
  const faceHeight = Math.sqrt(
    Math.pow(chinBottom.x - foreheadTop.x, 2) + Math.pow(chinBottom.y - foreheadTop.y, 2)
  )
  const jawWidth = Math.sqrt(
    Math.pow(jawRight.x - jawLeft.x, 2) + Math.pow(jawRight.y - jawLeft.y, 2)
  )

  // Calculate ratios (scale-invariant features)
  return [
    leftEyeWidth / faceHeight,
    rightEyeWidth / faceHeight,
    eyeDistance / faceHeight,
    noseLength / faceHeight,
    mouthWidth / faceHeight,
    jawWidth / faceHeight,
    eyeDistance / mouthWidth,
    leftEyeWidth / rightEyeWidth,
    mouthWidth / jawWidth,
  ]
}

/**
 * So sánh 2 khuôn mặt dựa trên landmarks
 * Trả về điểm tương đồng từ 0-100
 */
export function compareFaceLandmarks(
  landmarks1: FaceLandmarks | null,
  landmarks2: FaceLandmarks | null
): FaceVerificationResult {
  // Validate input
  if (!landmarks1 || !landmarks2) {
    return {
      isMatch: false,
      similarityScore: 0,
      confidence: 'low',
      message: 'Không thể phát hiện khuôn mặt trong một hoặc cả hai ảnh',
    }
  }

  if (
    !landmarks1.landmarks ||
    !landmarks2.landmarks ||
    landmarks1.landmarks.length === 0 ||
    landmarks2.landmarks.length === 0
  ) {
    return {
      isMatch: false,
      similarityScore: 0,
      confidence: 'low',
      message: 'Dữ liệu landmarks không hợp lệ',
    }
  }

  try {
    // 1. So sánh facial ratios (đặc trưng cá nhân)
    const ratios1 = calculateFacialRatios(landmarks1.landmarks)
    const ratios2 = calculateFacialRatios(landmarks2.landmarks)

    // Tính difference % cho từng ratio
    const ratioDiffs = ratios1.map((r1, i) => {
      const r2 = ratios2[i]
      return Math.abs(r1 - r2) / Math.max(r1, r2)
    })
    const avgRatioDiff = ratioDiffs.reduce((sum, diff) => sum + diff, 0) / ratioDiffs.length
    const ratioScore = Math.round((1 - avgRatioDiff) * 100)

    // 2. Extract key landmarks và normalize
    const key1 = extractKeyLandmarks(landmarks1.landmarks)
    const key2 = extractKeyLandmarks(landmarks2.landmarks)

    if (key1.length !== key2.length) {
      return {
        isMatch: false,
        similarityScore: 0,
        confidence: 'low',
        message: 'Số lượng landmarks không khớp',
      }
    }

    // Normalize landmarks
    const norm1 = normalizeLandmarks(key1)
    const norm2 = normalizeLandmarks(key2)

    if (norm1.length === 0 || norm2.length === 0) {
      return {
        isMatch: false,
        similarityScore: 0,
        confidence: 'low',
        message: 'Không thể chuẩn hóa landmarks',
      }
    }

    // Flatten arrays
    const flat1 = norm1.flat()
    const flat2 = norm2.flat()

    // 3. Tính cosine similarity (shape similarity)
    const cosineSim = cosineSimilarity(flat1, flat2)
    const cosineScore = Math.round(((cosineSim + 1) / 2) * 100)

    // 4. Tính Euclidean distance
    const euclideanDist = euclideanDistance(flat1, flat2)
    const distanceScore = Math.round(Math.max(0, 100 - euclideanDist * 10))

    // 5. Combined score với trọng số ưu tiên facial ratios
    // Ratios 50%, Cosine 30%, Distance 20%
    const finalScore = Math.round(ratioScore * 0.5 + cosineScore * 0.3 + distanceScore * 0.2)

    // Determine match result
    let isMatch = false
    let confidence: 'high' | 'medium' | 'low' = 'low'
    let message = ''

    if (finalScore >= VERIFICATION_THRESHOLDS.HIGH) {
      isMatch = true
      confidence = 'high'
      message = 'Khuôn mặt khớp với độ tin cậy cao'
    } else if (finalScore >= VERIFICATION_THRESHOLDS.MEDIUM) {
      isMatch = true
      confidence = 'medium'
      message = 'Khuôn mặt khớp với độ tin cậy trung bình'
    } else if (finalScore >= VERIFICATION_THRESHOLDS.MIN) {
      isMatch = false
      confidence = 'low'
      message = 'Khuôn mặt có thể khớp nhưng độ tin cậy thấp'
    } else {
      isMatch = false
      confidence = 'low'
      message = 'Khuôn mặt không khớp'
    }

    return {
      isMatch,
      similarityScore: finalScore,
      confidence,
      message,
    }
  } catch (error) {
    console.error('❌ Error comparing face landmarks:', error)
    return {
      isMatch: false,
      similarityScore: 0,
      confidence: 'low',
      message: 'Lỗi khi so sánh khuôn mặt: ' + (error as Error).message,
    }
  }
}

/**
 * Validate landmarks data có đúng format không
 */
export function validateLandmarks(data: any): data is FaceLandmarks {
  if (!data || typeof data !== 'object') {
    return false
  }

  if (!Array.isArray(data.landmarks)) {
    return false
  }

  // Check first few landmarks have x, y, z
  for (let i = 0; i < Math.min(5, data.landmarks.length); i++) {
    const landmark = data.landmarks[i]
    if (
      typeof landmark.x !== 'number' ||
      typeof landmark.y !== 'number' ||
      typeof landmark.z !== 'number'
    ) {
      return false
    }
  }

  return true
}

/**
 * Extract face descriptor từ image sử dụng face-api.js FaceNet
 * Đây là method CHÍNH XÁC cho face verification
 */
export async function extractFaceDescriptor(
  imageUrl: string
): Promise<FaceDescriptor | null> {
  try {
    const faceapi = await loadFaceApiModels()

    // Load image
    const img = new Image()
    img.crossOrigin = 'anonymous'

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = imageUrl
    })

    // Detect face with landmarks and descriptor
    const detection = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!detection) {
      return null
    }

    return {
      descriptor: detection.descriptor
    }
  } catch (error) {
    console.error('Error extracting face descriptor:', error)
    return null
  }
}

/**
 * So sánh 2 face descriptors từ face-api.js
 * Đây là method CHÍNH XÁC và được khuyến nghị
 */
export async function compareFaceDescriptors(
  descriptor1: FaceDescriptor | null,
  descriptor2: FaceDescriptor | null
): Promise<FaceVerificationResult> {
  if (!descriptor1 || !descriptor2) {
    return {
      isMatch: false,
      similarityScore: 0,
      confidence: 'low',
      message: 'Không thể phát hiện khuôn mặt trong một hoặc cả hai ảnh',
    }
  }

  try {
    // Calculate Euclidean distance between descriptors
    const faceapi = await import('face-api.js')
    const distance = faceapi.euclideanDistance(descriptor1.descriptor, descriptor2.descriptor)

    // Convert distance to similarity score (0-100)
    const similarityScore = Math.round(Math.max(0, (1 - distance) * 100))

    // Determine match based on FaceNet thresholds
    let isMatch = false
    let confidence: 'high' | 'medium' | 'low' = 'low'
    let message = ''

    if (distance < FACENET_THRESHOLDS.HIGH) {
      isMatch = true
      confidence = 'high'
      message = `✅ Cùng một người! (distance: ${distance.toFixed(3)})`
    } else if (distance < FACENET_THRESHOLDS.MEDIUM) {
      isMatch = false
      confidence = 'medium'
      message = `⚠️ Không chắc chắn, từ chối để an toàn (distance: ${distance.toFixed(3)})`
    } else {
      isMatch = false
      confidence = 'low'
      message = `❌ Khác người! (distance: ${distance.toFixed(3)})`
    }

    return {
      isMatch,
      similarityScore,
      confidence,
      message,
      distance,
    }
  } catch (error) {
    console.error('Error comparing descriptors:', error)
    return {
      isMatch: false,
      similarityScore: 0,
      confidence: 'low',
      message: 'Lỗi khi so sánh: ' + (error as Error).message,
    }
  }
}

/**
 * Format verification result cho UI display
 */
export function formatVerificationResult(result: FaceVerificationResult): {
  icon: string
  color: string
  title: string
  description: string
} {
  if (result.isMatch) {
    if (result.confidence === 'high') {
      return {
        icon: '✅',
        color: 'success',
        title: 'Xác thực thành công',
        description: `Khuôn mặt khớp với độ chính xác ${result.similarityScore}%`,
      }
    } else {
      return {
        icon: '✓',
        color: 'warning',
        title: 'Xác thực thành công (cảnh báo)',
        description: `Khuôn mặt khớp nhưng độ tin cậy trung bình (${result.similarityScore}%)`,
      }
    }
  } else {
    return {
      icon: '❌',
      color: 'danger',
      title: 'Xác thực thất bại',
      description: result.message || 'Khuôn mặt không khớp với ảnh mẫu',
    }
  }
}
