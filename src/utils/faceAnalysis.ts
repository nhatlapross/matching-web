/**
 * Face Analysis Utilities using MediaPipe Face Mesh
 * Extracts facial features and measurements for physiognomy analysis
 */

export interface FaceLandmarks {
  landmarks: { x: number; y: number; z: number }[]
}

export interface FaceFeatures {
  // Khuôn mặt tổng thể
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond'
  faceWidth: number
  faceHeight: number
  faceRatio: number // height/width

  // Tam Đình (Ba Vùng Khuôn Mặt) - Phân tích tướng học truyền thống
  tamDinh: {
    thuongDinhHeight: number // Thượng Đình - Trán (15-30 tuổi)
    trungDinhHeight: number // Trung Đình - Giữa mặt (31-50 tuổi)
    haDinhHeight: number // Hạ Đình - Hàm (51+ tuổi)
    thuongDinhRatio: number // Tỷ lệ Thượng Đình / tổng
    trungDinhRatio: number // Tỷ lệ Trung Đình / tổng
    haDinhRatio: number // Tỷ lệ Hạ Đình / tổng
    balance: number // Điểm cân bằng (0-100)
    interpretation: string // Giải thích ngắn
  }

  // Trán (Forehead)
  foreheadHeight: number
  foreheadWidth: number
  foreheadRatio: number

  // Mắt (Eyes)
  eyeWidth: number
  eyeDistance: number
  eyeToFaceRatio: number
  leftEyeWidth: number
  rightEyeWidth: number
  eyeSymmetry: number // 0-1, 1 is perfect symmetry

  // Mũi (Nose)
  noseWidth: number
  noseLength: number
  noseRatio: number
  noseBridgeWidth: number

  // Miệng (Mouth)
  mouthWidth: number
  lipThickness: number
  mouthToNoseRatio: number

  // Má (Cheeks)
  cheekboneWidth: number
  cheekboneProminence: number

  // Hàm (Jaw)
  jawWidth: number
  jawlineDefinition: number
  chinLength: number

  // Tỷ lệ ngũ quan
  goldenRatioScore: number // 0-100
  facialSymmetry: number // 0-100
  facialHarmony: number // 0-100
}

/**
 * Safe division to avoid NaN
 */
function safeDivide(numerator: number, denominator: number, defaultValue: number = 1): number {
  if (!isFinite(numerator) || !isFinite(denominator) || denominator === 0 || Math.abs(denominator) < 0.0001) {
    return defaultValue
  }
  const result = numerator / denominator
  return isFinite(result) ? result : defaultValue
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  if (!isFinite(value)) return min
  return Math.max(min, Math.min(max, value))
}

/**
 * Calculate distance between two points
 */
function calculateDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  return isFinite(distance) ? Math.max(0.1, distance) : 0.1 // Minimum distance to avoid 0
}

/**
 * Calculate face width at specific height
 */
function getFaceWidth(landmarks: { x: number; y: number; z: number }[]): number {
  // Left cheek to right cheek (landmarks 234 and 454)
  const leftCheek = landmarks[234]
  const rightCheek = landmarks[454]
  return calculateDistance(leftCheek, rightCheek)
}

/**
 * Calculate face height
 */
function getFaceHeight(landmarks: { x: number; y: number; z: number }[]): number {
  // Forehead top to chin bottom (landmarks 10 and 152)
  const foreheadTop = landmarks[10]
  const chinBottom = landmarks[152]
  return calculateDistance(foreheadTop, chinBottom)
}

/**
 * Determine face shape based on measurements
 * Using more flexible thresholds based on actual face proportions
 */
function determineFaceShape(
  faceWidth: number,
  faceHeight: number,
  jawWidth: number,
  foreheadWidth: number,
  cheekboneWidth: number
): FaceFeatures['faceShape'] {
  // Calculate ratios
  const heightToWidthRatio = safeDivide(faceHeight, faceWidth, 1.3)
  const jawToCheekRatio = safeDivide(jawWidth, cheekboneWidth, 0.9)
  const foreheadToCheekRatio = safeDivide(foreheadWidth, cheekboneWidth, 1.0)
  const cheekToWidthRatio = safeDivide(cheekboneWidth, faceWidth, 1.0)

  console.log('Face shape analysis:', {
    faceWidth,
    faceHeight,
    jawWidth,
    foreheadWidth,
    cheekboneWidth,
    heightToWidthRatio,
    jawToCheekRatio,
    foreheadToCheekRatio,
    cheekToWidthRatio
  })

  // Oblong: Tall and narrow (height > width significantly)
  if (heightToWidthRatio > 1.4) {
    console.log('✅ Detected: OBLONG (tall face)')
    return 'oblong'
  }

  // Round: Short and wide with rounded jaw
  if (heightToWidthRatio < 1.15 && jawToCheekRatio > 0.95) {
    console.log('✅ Detected: ROUND (short + wide jaw)')
    return 'round'
  }

  // Square: Similar height/width with strong jaw
  if (heightToWidthRatio >= 0.95 && heightToWidthRatio <= 1.15 && jawToCheekRatio > 0.90 && jawToCheekRatio <= 0.98) {
    console.log('✅ Detected: SQUARE (balanced + strong jaw)')
    return 'square'
  }

  // Heart: Wide forehead, narrow jaw
  if (foreheadToCheekRatio > 1.02 && jawToCheekRatio < 0.88) {
    console.log('✅ Detected: HEART (wide forehead + narrow jaw)')
    return 'heart'
  }

  // Diamond: Prominent cheeks, narrow forehead and jaw
  if (cheekToWidthRatio > 0.95 && foreheadToCheekRatio < 0.96 && jawToCheekRatio < 0.88) {
    console.log('✅ Detected: DIAMOND (prominent cheeks)')
    return 'diamond'
  }

  // Oval: Balanced proportions (default)
  console.log('✅ Detected: OVAL (balanced/default)')
  return 'oval'
}

/**
 * Calculate facial symmetry score
 */
function calculateSymmetry(landmarks: { x: number; y: number; z: number }[]): number {
  const symmetryPairs = [
    [33, 263], // Eyes outer corners
    [130, 359], // Eyes inner corners
    [46, 276], // Eyebrows
    [234, 454], // Cheeks
    [129, 358], // Nose wings (fixed indices)
    [61, 291], // Mouth corners
  ]

  let totalDeviation = 0
  const centerX = landmarks[1].x // Nose bridge center

  symmetryPairs.forEach(([leftIdx, rightIdx]) => {
    const left = landmarks[leftIdx]
    const right = landmarks[rightIdx]

    const leftDist = Math.abs(left.x - centerX)
    const rightDist = Math.abs(right.x - centerX)
    const avgDist = (leftDist + rightDist) / 2

    const deviation = safeDivide(Math.abs(leftDist - rightDist), avgDist, 0)

    totalDeviation += deviation
  })

  const avgDeviation = safeDivide(totalDeviation, symmetryPairs.length, 0)
  const score = Math.max(0, 100 - avgDeviation * 100)
  return clamp(score, 0, 100)
}

/**
 * Calculate golden ratio score
 * Based on phi (1.618) proportions in facial features
 */
function calculateGoldenRatio(
  faceHeight: number,
  faceWidth: number,
  eyeDistance: number,
  noseLength: number,
  mouthWidth: number
): number {
  const phi = 1.618
  const scores: number[] = []

  // Face height to width ratio
  const faceRatio = safeDivide(faceHeight, faceWidth, phi)
  scores.push(clamp(100 - Math.abs(faceRatio - phi) * 50, 0, 100))

  // Eye distance to face width ratio
  const eyeRatio = safeDivide(faceWidth, eyeDistance, phi)
  scores.push(clamp(100 - Math.abs(eyeRatio - phi) * 50, 0, 100))

  // Nose to mouth ratio
  const noseMouthRatio = safeDivide(noseLength, safeDivide(mouthWidth, 2, 1), phi)
  scores.push(clamp(100 - Math.abs(noseMouthRatio - phi) * 50, 0, 100))

  return safeDivide(scores.reduce((a, b) => a + b, 0), scores.length, 50)
}

/**
 * Calculate centroid (average point) from a set of landmarks
 */
function calculateCentroid(landmarks: { x: number; y: number; z: number }[], indices: number[]): { x: number; y: number } {
  let sumX = 0
  let sumY = 0
  let count = 0

  indices.forEach(idx => {
    if (idx >= 0 && idx < landmarks.length) {
      sumX += landmarks[idx].x
      sumY += landmarks[idx].y
      count++
    }
  })

  return {
    x: count > 0 ? sumX / count : 0,
    y: count > 0 ? sumY / count : 0
  }
}

/**
 * Calculate Tam Đình (Three Face Regions) according to traditional physiognomy
 * Thượng Đình (Upper): Hairline to eyebrows - Youth phase (15-30 years)
 * Trung Đình (Middle): Eyebrows to nose base - Middle age (31-50 years)
 * Hạ Đình (Lower): Nose base to chin - Later years (51+ years)
 */
function calculateTamDinh(landmarks: { x: number; y: number; z: number }[]): FaceFeatures['tamDinh'] {
  // Thượng Đình boundaries
  // Top: Hairline approximation (landmark #10 and nearby)
  const thuongDinhTop = calculateCentroid(landmarks, [10, 338, 297, 332])
  // Bottom: Eyebrow line
  const thuongDinhBottom = calculateCentroid(landmarks, [70, 63, 105, 66, 107, 336, 296, 334, 293, 300])

  // Trung Đình boundaries
  // Top: Same as Thượng Đình bottom (eyebrow line)
  const trungDinhTop = thuongDinhBottom
  // Bottom: Nose base (subnasale)
  const trungDinhBottom = calculateCentroid(landmarks, [2, 94, 324])

  // Hạ Đình boundaries
  // Top: Same as Trung Đình bottom (nose base)
  const haDinhTop = trungDinhBottom
  // Bottom: Chin tip
  const haDinhBottom = { x: landmarks[152].x, y: landmarks[152].y }

  // Calculate heights
  const thuongDinhHeight = Math.abs(thuongDinhTop.y - thuongDinhBottom.y)
  const trungDinhHeight = Math.abs(trungDinhTop.y - trungDinhBottom.y)
  const haDinhHeight = Math.abs(haDinhTop.y - haDinhBottom.y)
  const totalHeight = thuongDinhHeight + trungDinhHeight + haDinhHeight

  // Calculate ratios
  const thuongDinhRatio = safeDivide(thuongDinhHeight, totalHeight, 0.33)
  const trungDinhRatio = safeDivide(trungDinhHeight, totalHeight, 0.33)
  const haDinhRatio = safeDivide(haDinhHeight, totalHeight, 0.34)

  // Calculate balance score (ideal is 1:1:1 ratio, or 33.3% each)
  const idealRatio = 0.333
  const deviation1 = Math.abs(thuongDinhRatio - idealRatio)
  const deviation2 = Math.abs(trungDinhRatio - idealRatio)
  const deviation3 = Math.abs(haDinhRatio - idealRatio)
  const avgDeviation = (deviation1 + deviation2 + deviation3) / 3
  const balance = clamp(100 - (avgDeviation * 300), 0, 100)

  // Interpretation based on ratios
  let interpretation = ''
  if (balance >= 85) {
    interpretation = 'Ba vùng cân đối tuyệt vời - Vận mệnh hài hòa qua các giai đoạn cuộc đời'
  } else if (balance >= 70) {
    interpretation = 'Ba vùng cân đối tốt - Cuộc sống ổn định và phát triển đều'
  } else {
    // Identify dominant region
    if (thuongDinhRatio > trungDinhRatio && thuongDinhRatio > haDinhRatio) {
      interpretation = 'Thượng Đình phát triển - Trí tuệ, vận may thời trẻ tốt'
    } else if (trungDinhRatio > thuongDinhRatio && trungDinhRatio > haDinhRatio) {
      interpretation = 'Trung Đình phát triển - Sự nghiệp trung niên thịnh vượng'
    } else {
      interpretation = 'Hạ Đình phát triển - Hậu vận tốt, cuối đời an nhàn'
    }
  }

  console.log('Tam Đình analysis:', {
    thuongDinhHeight,
    trungDinhHeight,
    haDinhHeight,
    totalHeight,
    thuongDinhRatio: (thuongDinhRatio * 100).toFixed(1) + '%',
    trungDinhRatio: (trungDinhRatio * 100).toFixed(1) + '%',
    haDinhRatio: (haDinhRatio * 100).toFixed(1) + '%',
    balance: balance.toFixed(1),
    interpretation
  })

  return {
    thuongDinhHeight,
    trungDinhHeight,
    haDinhHeight,
    thuongDinhRatio,
    trungDinhRatio,
    haDinhRatio,
    balance,
    interpretation
  }
}

/**
 * Extract all facial features from MediaPipe landmarks
 */
export function extractFaceFeatures(
  landmarks: { x: number; y: number; z: number }[]
): FaceFeatures {
  // Basic measurements
  const faceWidth = getFaceWidth(landmarks)
  const faceHeight = getFaceHeight(landmarks)

  // Forehead
  const foreheadTop = landmarks[10]
  const foreheadLeft = landmarks[21]
  const foreheadRight = landmarks[251]
  const foreheadBottom = landmarks[8]
  const foreheadHeight = calculateDistance(foreheadTop, foreheadBottom)
  const foreheadWidth = calculateDistance(foreheadLeft, foreheadRight)

  // Eyes
  const leftEyeLeft = landmarks[33]
  const leftEyeRight = landmarks[133]
  const rightEyeLeft = landmarks[362]
  const rightEyeRight = landmarks[263]
  const leftEyeWidth = calculateDistance(leftEyeLeft, leftEyeRight)
  const rightEyeWidth = calculateDistance(rightEyeLeft, rightEyeRight)
  const eyeWidth = (leftEyeWidth + rightEyeWidth) / 2
  const eyeDistance = calculateDistance(
    landmarks[130], // left eye inner corner
    landmarks[359]  // right eye inner corner
  )
  const eyeSymmetry = 1 - safeDivide(Math.abs(leftEyeWidth - rightEyeWidth), eyeWidth, 0)

  // Nose
  const noseTop = landmarks[6]
  const noseBottom = landmarks[4]
  const noseLeft = landmarks[358]
  const noseRight = landmarks[129]
  const noseLength = calculateDistance(noseTop, noseBottom)
  const noseWidth = calculateDistance(noseLeft, noseRight)
  const noseBridgeWidth = calculateDistance(landmarks[168], landmarks[6])

  // Mouth
  const mouthLeft = landmarks[61]
  const mouthRight = landmarks[291]
  const mouthTop = landmarks[13]
  const mouthBottom = landmarks[14]
  const mouthWidth = calculateDistance(mouthLeft, mouthRight)
  const lipThickness = calculateDistance(mouthTop, mouthBottom)

  // Cheeks
  const leftCheek = landmarks[234]
  const rightCheek = landmarks[454]
  const cheekboneWidth = calculateDistance(leftCheek, rightCheek)
  const cheekboneProminence = (leftCheek.z + rightCheek.z) / 2

  // Jaw
  const leftJaw = landmarks[172]
  const rightJaw = landmarks[397]
  const jawWidth = calculateDistance(leftJaw, rightJaw)
  const chin = landmarks[152]
  const jawlineDefinition = Math.abs(chin.z)
  const chinLength = calculateDistance(landmarks[175], chin)

  // Debug logging
  console.log('Face measurements:', {
    faceWidth,
    faceHeight,
    jawWidth,
    foreheadWidth,
    cheekboneWidth,
    foreheadHeight,
    eyeWidth,
    noseWidth,
    mouthWidth
  })

  // Determine face shape
  const faceShape = determineFaceShape(
    faceWidth,
    faceHeight,
    jawWidth,
    foreheadWidth,
    cheekboneWidth
  )

  // Calculate Tam Đình (Three Face Regions)
  const tamDinh = calculateTamDinh(landmarks)

  // Calculate scores
  const facialSymmetry = calculateSymmetry(landmarks)
  const goldenRatioScore = calculateGoldenRatio(
    faceHeight,
    faceWidth,
    eyeDistance,
    noseLength,
    mouthWidth
  )

  // Facial harmony (combination of symmetry and proportions)
  const facialHarmony = (facialSymmetry + goldenRatioScore) / 2

  return {
    faceShape,
    faceWidth,
    faceHeight,
    faceRatio: safeDivide(faceHeight, faceWidth, 1.3),
    tamDinh,
    foreheadHeight,
    foreheadWidth,
    foreheadRatio: safeDivide(foreheadHeight, foreheadWidth, 1.0),
    eyeWidth,
    eyeDistance,
    eyeToFaceRatio: safeDivide(eyeWidth, faceWidth, 0.3),
    leftEyeWidth,
    rightEyeWidth,
    eyeSymmetry: clamp(eyeSymmetry, 0, 1),
    noseWidth,
    noseLength,
    noseRatio: safeDivide(noseLength, noseWidth, 1.5),
    noseBridgeWidth,
    mouthWidth,
    lipThickness,
    mouthToNoseRatio: safeDivide(mouthWidth, noseWidth, 1.5),
    cheekboneWidth,
    cheekboneProminence,
    jawWidth,
    jawlineDefinition,
    chinLength,
    goldenRatioScore: clamp(goldenRatioScore, 0, 100),
    facialSymmetry: clamp(facialSymmetry, 0, 100),
    facialHarmony: clamp(facialHarmony, 0, 100),
  }
}

/**
 * Load MediaPipe Face Mesh
 */
export async function loadFaceMesh() {
  try {
    // Dynamic import to avoid SSR issues
    const faceMeshModule = await import('@mediapipe/face_mesh')
    const FaceMesh = faceMeshModule.FaceMesh

    const faceMesh = new FaceMesh({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      },
    })

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    console.log('MediaPipe Face Mesh loaded successfully')
    return faceMesh
  } catch (error) {
    console.error('Failed to load MediaPipe:', error)
    throw error
  }
}

/**
 * Analyze face from image element using MediaPipe Face Mesh
 */
export async function analyzeFaceFromImage(
  imageElement: HTMLImageElement,
  faceMesh: any
): Promise<FaceFeatures | null> {
  return new Promise((resolve, reject) => {
    let resolved = false

    // Set up one-time callback for results
    const onResults = (results: any) => {
      if (resolved) return // Prevent multiple resolutions
      resolved = true

      try {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
          console.log('No face detected by MediaPipe')
          resolve(null)
          return
        }

        // Get the first face's landmarks (468 points)
        const faceLandmarks = results.multiFaceLandmarks[0]

        // Convert MediaPipe normalized coordinates to pixel coordinates
        // Use naturalWidth/naturalHeight for accurate dimensions
        const landmarks: { x: number; y: number; z: number }[] = faceLandmarks.map((landmark: any) => ({
          x: landmark.x * imageElement.naturalWidth,
          y: landmark.y * imageElement.naturalHeight,
          z: landmark.z * imageElement.naturalWidth, // Scale z to image width
        }))

        console.log(`MediaPipe detected ${landmarks.length} landmarks with 3D coordinates`)

        // Extract features from 468 landmarks
        const features = extractFaceFeatures(landmarks)

        resolve(features)
      } catch (error) {
        console.error('Error processing MediaPipe results:', error)
        resolve(null)
      }
    }

    // Set callback
    faceMesh.onResults(onResults)

    // Send image to MediaPipe with error handling
    try {
      faceMesh.send({ image: imageElement }).catch((err: any) => {
        if (!resolved) {
          resolved = true
          console.error('MediaPipe send error:', err)
          reject(err)
        }
      })

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          console.error('MediaPipe analysis timeout')
          resolve(null)
        }
      }, 10000)
    } catch (error) {
      if (!resolved) {
        resolved = true
        console.error('Error sending image to MediaPipe:', error)
        reject(error)
      }
    }
  })
}
