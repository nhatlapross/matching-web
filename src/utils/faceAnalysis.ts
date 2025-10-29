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
  // Dynamic import to avoid SSR issues
  const { FaceMesh } = await import('@mediapipe/face_mesh')

  const faceMesh = new FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    },
  })

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true, // Enable refined landmarks for better accuracy
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })

  return faceMesh
}

/**
 * Analyze face from image element using MediaPipe Face Mesh
 */
export async function analyzeFaceFromImage(
  imageElement: HTMLImageElement,
  faceMesh: any
): Promise<FaceFeatures | null> {
  return new Promise((resolve) => {
    // Set up callback for results
    faceMesh.onResults((results: any) => {
      try {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
          resolve(null)
          return
        }

        // Get the first face's landmarks (468 points)
        const faceLandmarks = results.multiFaceLandmarks[0]

        // Convert MediaPipe normalized coordinates to pixel coordinates
        const landmarks: { x: number; y: number; z: number }[] = faceLandmarks.map((landmark: any) => ({
          x: landmark.x * imageElement.width,
          y: landmark.y * imageElement.height,
          z: landmark.z * imageElement.width, // Scale z to image width
        }))

        console.log('MediaPipe detected 468 landmarks with 3D coordinates')

        // Extract features from 468 landmarks
        const features = extractFaceFeatures(landmarks)

        resolve(features)
      } catch (error) {
        console.error('Error processing MediaPipe results:', error)
        resolve(null)
      }
    })

    // Send image to MediaPipe
    faceMesh.send({ image: imageElement })
  })
}
