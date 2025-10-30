/**
 * Face Compatibility Calculator - Tướng Phu Thê Analysis
 * Based on traditional physiognomy principles with 1000-point scoring system
 *
 * Scoring Components:
 * 1. Tam Đình Ratio (300 points - 30%): Face region proportions
 * 2. Ngũ Quan Similarity (400 points - 40%): Five facial features
 * 3. Overall Structure (150 points - 15%): Face shape compatibility
 * 4. Yin-Yang Balance (150 points - 15%): Complementary traits
 */

import { type FaceFeatures } from './faceAnalysis'
import { type PhysiognomyTraits } from './physiognomy'

export interface CompatibilityResult {
  overallScore: number // 0-1000
  categories: {
    tamDinhRatio: number // Tỷ lệ Tam Đình (0-300)
    nguQuanSimilarity: number // Tương đồng Ngũ Quan (0-400)
    overallStructure: number // Cấu trúc tổng thể (0-150)
    yinYangBalance: number // Cân bằng Âm-Dương (0-150)
  }
  details: {
    strengths: string[] // Điểm mạnh trong mối quan hệ
    challenges: string[] // Thách thức cần vượt qua
    advice: string[] // Lời khuyên
  }
  analysis: string // Phân tích chi tiết
  compatibilityLevel: 'Rất cao' | 'Cao' | 'Trung bình' | 'Thấp' // Level
}

/**
 * Helper: Safe division to avoid NaN
 */
function safeDivide(numerator: number, denominator: number, defaultValue: number = 0): number {
  if (!isFinite(numerator) || !isFinite(denominator) || denominator === 0 || Math.abs(denominator) < 0.0001) {
    return defaultValue
  }
  const result = numerator / denominator
  return isFinite(result) ? result : defaultValue
}

/**
 * Helper: Safe number that defaults to 0 if NaN/Infinity
 */
function safeNumber(value: number, defaultValue: number = 0): number {
  return isFinite(value) ? value : defaultValue
}

/**
 * Helper: Calculate Euclidean distance between two vectors
 */
function euclideanDistance(v1: number[], v2: number[]): number {
  if (v1.length !== v2.length) return 0

  // Filter out any NaN or Infinity values
  const validPairs = v1.map((val, i) => ({
    v1: safeNumber(val),
    v2: safeNumber(v2[i])
  }))

  const sumSquares = validPairs.reduce((sum, pair) => {
    return sum + Math.pow(pair.v1 - pair.v2, 2)
  }, 0)

  return Math.sqrt(sumSquares)
}

/**
 * Helper: Normalize distance to similarity score (0-1)
 */
function distanceToSimilarity(distance: number, maxDistance: number = 1.0): number {
  if (!isFinite(distance) || !isFinite(maxDistance) || maxDistance === 0) {
    return 0
  }
  return Math.max(0, Math.min(1, 1 - distance / maxDistance))
}

/**
 * 1. Calculate Tam Đình (Three Face Regions) Ratio Score
 * Maximum: 300 points (30%)
 *
 * Principle: Similar life rhythm and destiny
 */
function calculateTamDinhRatio(
  features1: FaceFeatures,
  features2: FaceFeatures
): number {
  const td1 = features1.tamDinh
  const td2 = features2.tamDinh

  // Create ratio vectors for comparison with safe numbers
  const ratioVector1 = [
    safeNumber(td1.thuongDinhRatio, 0.33),
    safeNumber(td1.trungDinhRatio, 0.33),
    safeNumber(td1.haDinhRatio, 0.34)
  ]
  const ratioVector2 = [
    safeNumber(td2.thuongDinhRatio, 0.33),
    safeNumber(td2.trungDinhRatio, 0.33),
    safeNumber(td2.haDinhRatio, 0.34)
  ]

  // Calculate Euclidean distance between ratio vectors
  const distance = euclideanDistance(ratioVector1, ratioVector2)

  // Maximum possible distance between valid ratio vectors is ~0.6
  // (when one is [0.6, 0.2, 0.2] and other is [0.2, 0.2, 0.6])
  const maxDistance = 0.6

  // Convert distance to similarity score (0-1)
  const similarity = distanceToSimilarity(distance, maxDistance)

  // Scale to 300 points
  return Math.round(similarity * 300)
}

/**
 * 2. Calculate Ngũ Quan (Five Features) Similarity Score
 * Maximum: 400 points (40%)
 *
 * Distribution: 80 points per feature
 * - Eyes (Mắt): 80 points
 * - Eyebrows (Lông mày): 80 points
 * - Nose (Mũi): 80 points
 * - Mouth (Miệng): 80 points
 * - Face structure (Cấu trúc): 80 points
 */
function calculateNguQuanSimilarity(
  features1: FaceFeatures,
  features2: FaceFeatures
): number {
  let totalScore = 0

  // 1. Eyes similarity (80 points)
  const eyeVector1 = [
    safeDivide(features1.eyeWidth, features1.faceWidth, 0.2),
    safeDivide(features1.eyeDistance, features1.faceWidth, 0.3),
    safeNumber(features1.eyeSymmetry, 0.5)
  ]
  const eyeVector2 = [
    safeDivide(features2.eyeWidth, features2.faceWidth, 0.2),
    safeDivide(features2.eyeDistance, features2.faceWidth, 0.3),
    safeNumber(features2.eyeSymmetry, 0.5)
  ]
  const eyeDistance = euclideanDistance(eyeVector1, eyeVector2)
  const eyeSimilarity = distanceToSimilarity(eyeDistance, 0.3)
  totalScore += Math.round(eyeSimilarity * 80)

  // 2. Eyebrows similarity (80 points)
  // Use eye-related measurements as proxy for eyebrows
  const browDistance = Math.abs(
    features1.eyeToFaceRatio - features2.eyeToFaceRatio
  )
  const browSimilarity = distanceToSimilarity(browDistance, 0.1)
  totalScore += Math.round(browSimilarity * 80)

  // 3. Nose similarity (80 points)
  const noseVector1 = [
    safeDivide(features1.noseWidth, features1.faceWidth, 0.2),
    safeDivide(features1.noseLength, features1.faceHeight, 0.15),
    safeDivide(features1.noseBridgeWidth, features1.faceWidth, 0.1)
  ]
  const noseVector2 = [
    safeDivide(features2.noseWidth, features2.faceWidth, 0.2),
    safeDivide(features2.noseLength, features2.faceHeight, 0.15),
    safeDivide(features2.noseBridgeWidth, features2.faceWidth, 0.1)
  ]
  const noseDistance = euclideanDistance(noseVector1, noseVector2)
  const noseSimilarity = distanceToSimilarity(noseDistance, 0.3)
  totalScore += Math.round(noseSimilarity * 80)

  // 4. Mouth similarity (80 points)
  const mouthVector1 = [
    safeDivide(features1.mouthWidth, features1.faceWidth, 0.35),
    safeDivide(features1.lipThickness, features1.faceHeight, 0.05)
  ]
  const mouthVector2 = [
    safeDivide(features2.mouthWidth, features2.faceWidth, 0.35),
    safeDivide(features2.lipThickness, features2.faceHeight, 0.05)
  ]
  const mouthDistance = euclideanDistance(mouthVector1, mouthVector2)
  const mouthSimilarity = distanceToSimilarity(mouthDistance, 0.2)
  totalScore += Math.round(mouthSimilarity * 80)

  // 5. Jaw/Face structure (80 points)
  const jawVector1 = [
    safeDivide(features1.jawWidth, features1.faceWidth, 0.8),
    safeDivide(features1.chinLength, features1.faceHeight, 0.2)
  ]
  const jawVector2 = [
    safeDivide(features2.jawWidth, features2.faceWidth, 0.8),
    safeDivide(features2.chinLength, features2.faceHeight, 0.2)
  ]
  const jawDistance = euclideanDistance(jawVector1, jawVector2)
  const jawSimilarity = distanceToSimilarity(jawDistance, 0.2)
  totalScore += Math.round(jawSimilarity * 80)

  return Math.min(400, totalScore)
}

/**
 * 3. Calculate Overall Structure Compatibility Score
 * Maximum: 150 points (15%)
 *
 * Based on face shape harmony and golden ratio similarity
 */
function calculateOverallStructure(
  features1: FaceFeatures,
  features2: FaceFeatures
): number {
  let score = 0

  // Face shape compatibility matrix (90 points)
  const faceShapeCompatibility: Record<string, string[]> = {
    oval: ['round', 'square', 'heart', 'oblong', 'diamond'], // Compatible with all
    round: ['oval', 'square', 'oblong', 'round'],
    square: ['oval', 'round', 'heart', 'square'],
    heart: ['oval', 'square', 'diamond', 'heart'],
    oblong: ['oval', 'round', 'diamond', 'oblong'],
    diamond: ['oval', 'heart', 'oblong', 'diamond'],
  }

  // Same face shape: bonus points
  if (features1.faceShape === features2.faceShape) {
    score += 90 // Perfect harmony
  } else if (faceShapeCompatibility[features1.faceShape]?.includes(features2.faceShape)) {
    score += 70 // Good compatibility
  } else {
    score += 40 // Acceptable
  }

  // Face ratio similarity (30 points)
  const ratio1 = safeNumber(features1.faceRatio, 1.3)
  const ratio2 = safeNumber(features2.faceRatio, 1.3)
  const ratioDistance = Math.abs(ratio1 - ratio2)
  const ratioSimilarity = distanceToSimilarity(ratioDistance, 0.3)
  score += Math.round(ratioSimilarity * 30)

  // Facial harmony similarity (30 points)
  const harmony1 = safeNumber(features1.facialHarmony, 50)
  const harmony2 = safeNumber(features2.facialHarmony, 50)
  const harmonyDistance = Math.abs(harmony1 - harmony2)
  const harmonySimilarity = distanceToSimilarity(harmonyDistance, 30)
  score += Math.round(harmonySimilarity * 30)

  return Math.min(150, score)
}

/**
 * 4. Calculate Yin-Yang Complementarity Index
 * Maximum: 150 points (15%)
 *
 * Rewards harmonious contrasts (e.g., angular + soft)
 */
function calculateYinYangBalance(
  features1: FaceFeatures,
  features2: FaceFeatures,
  traits1: PhysiognomyTraits,
  traits2: PhysiognomyTraits
): number {
  let score = 0

  // Define "Yang" (masculine/angular) vs "Yin" (feminine/soft) scores
  const yang1 = calculateYangScore(features1, traits1)
  const yang2 = calculateYangScore(features2, traits2)

  // Maximum balance when one is high Yang and other is low (complementary)
  const yangDifference = Math.abs(yang1 - yang2)

  // Optimal difference range: 20-50 points
  if (yangDifference >= 20 && yangDifference <= 50) {
    score += 100 // Perfect complementarity
  } else if (yangDifference >= 10 && yangDifference < 20) {
    score += 70 // Good balance
  } else if (yangDifference > 50 && yangDifference <= 70) {
    score += 70 // Strong contrast (can work)
  } else if (yangDifference < 10) {
    score += 50 // Very similar (harmonious but less dynamic)
  } else {
    score += 30 // Too extreme
  }

  // Personality complementarity (50 points)
  const p1 = traits1.personality
  const p2 = traits2.personality

  // Leadership balance
  if ((p1.leadership > 70 && p2.leadership < 60) ||
      (p2.leadership > 70 && p1.leadership < 60)) {
    score += 20 // One leader, one supporter
  } else if (p1.leadership > 70 && p2.leadership > 70) {
    score += 5 // Both leaders (challenging)
  } else {
    score += 10 // Balanced
  }

  // Creativity + Practical balance
  if ((p1.creativity > 70 && p2.practical > 70) ||
      (p2.creativity > 70 && p1.practical > 70)) {
    score += 20 // Perfect team
  } else {
    score += 10
  }

  // Emotional balance
  const emotionalDiff = Math.abs(p1.emotional - p2.emotional)
  if (emotionalDiff < 15) {
    score += 10 // Similar emotional levels
  } else if (emotionalDiff > 30) {
    score += 5 // Need balance
  } else {
    score += 8
  }

  return Math.min(150, score)
}

/**
 * Helper: Calculate Yang (masculine/angular) score for a face
 */
function calculateYangScore(
  features: FaceFeatures,
  traits: PhysiognomyTraits
): number {
  let yangScore = 50 // Base score

  // Face shape (Yang: square, oblong; Yin: round, heart, oval)
  const yangFaceShapes = ['square', 'oblong']
  const yinFaceShapes = ['round', 'heart', 'oval']

  if (yangFaceShapes.includes(features.faceShape)) {
    yangScore += 20
  } else if (yinFaceShapes.includes(features.faceShape)) {
    yangScore -= 20
  }

  // Jaw prominence (wider jaw = more Yang)
  const jawProminence = safeDivide(features.jawWidth, features.faceWidth, 0.8)
  if (jawProminence > 0.85) {
    yangScore += 15
  } else if (jawProminence < 0.75) {
    yangScore -= 15
  }

  // Cheekbone prominence (higher = more Yang)
  const cheekProminence = safeDivide(features.cheekboneWidth, features.faceWidth, 0.85)
  if (cheekProminence > 0.9) {
    yangScore += 10
  } else if (cheekProminence < 0.8) {
    yangScore -= 10
  }

  // Personality traits
  if (traits.personality.leadership > 70) yangScore += 10
  if (traits.personality.determination > 70) yangScore += 10
  if (traits.personality.practical > 70) yangScore += 5

  return Math.max(0, Math.min(100, yangScore))
}

/**
 * Generate detailed compatibility analysis
 */
function generateCompatibilityAnalysis(
  features1: FaceFeatures,
  features2: FaceFeatures,
  traits1: PhysiognomyTraits,
  traits2: PhysiognomyTraits,
  scores: CompatibilityResult['categories'],
  overallScore: number
): {
  strengths: string[]
  challenges: string[]
  advice: string[]
  analysis: string
  compatibilityLevel: 'Rất cao' | 'Cao' | 'Trung bình' | 'Thấp'
} {
  const strengths: string[] = []
  const challenges: string[] = []
  const advice: string[] = []
  let compatibilityLevel: 'Rất cao' | 'Cao' | 'Trung bình' | 'Thấp'

  // Determine compatibility level
  if (overallScore >= 800) {
    compatibilityLevel = 'Rất cao'
  } else if (overallScore >= 600) {
    compatibilityLevel = 'Cao'
  } else if (overallScore >= 400) {
    compatibilityLevel = 'Trung bình'
  } else {
    compatibilityLevel = 'Thấp'
  }

  // Analyze Tam Đình ratio in detail
  const td1 = features1.tamDinh
  const td2 = features2.tamDinh

  if (scores.tamDinhRatio >= 240) {
    strengths.push(
      '✨ **Tam Đình hài hòa tuyệt vời**: Cả hai có nhịp điệu cuộc sống và vận mệnh tương đồng. ' +
      'Điều này có nghĩa là bạn sẽ trải qua các giai đoạn thăng trầm của cuộc đời cùng nhau, ' +
      'dễ dàng thấu hiểu và hỗ trợ nhau trong mỗi chặng đường.'
    )

    // Analyze which Đình is strongest for both
    if (td1.thuongDinhRatio > 0.35 && td2.thuongDinhRatio > 0.35) {
      strengths.push(
        '🌟 **Thượng Đình mạnh**: Cả hai đều có trán cao, biểu hiện trí tuệ và tầm nhìn xa. ' +
        'Đây là cặp đôi của những người có tư duy chiến lược và khả năng lập kế hoạch tốt.'
      )
    } else if (td1.trungDinhRatio > 0.35 && td2.trungDinhRatio > 0.35) {
      strengths.push(
        '💼 **Trung Đình nổi bật**: Vùng giữa mặt phát triển tốt ở cả hai, thể hiện sự thành công trong sự nghiệp và giai đoạn trung niên. ' +
        'Đây là thời kỳ cả hai sẽ cùng nhau xây dựng nền tảng vững chắc.'
      )
    }
  } else if (scores.tamDinhRatio >= 180) {
    strengths.push(
      '👍 **Tam Đình khá tương đồng**: Có sự đồng điệu về các giai đoạn cuộc đời, tuy không hoàn hảo nhưng đủ để hiểu và hỗ trợ nhau.'
    )
  } else if (scores.tamDinhRatio < 150) {
    // Analyze the differences
    const thuongDiff = Math.abs(td1.thuongDinhRatio - td2.thuongDinhRatio)
    const haDiff = Math.abs(td1.haDinhRatio - td2.haDinhRatio)

    if (thuongDiff > 0.15) {
      challenges.push(
        '⚠️ **Thượng Đình khác biệt**: Một người có trán cao (tư duy xa), người kia trán thấp hơn (thực tế hơn). ' +
        'Có thể có chênh lệch về tầm nhìn và cách tiếp cận vấn đề.'
      )
      advice.push(
        '🎯 Người có Thượng Đình cao nên học cách đơn giản hóa ý tưởng, còn người kia nên cởi mở với tầm nhìn dài hạn. ' +
        'Sự kết hợp giữa "mơ mộng" và "thực tế" có thể tạo nên đội ngũ hoàn hảo nếu biết tận dụng.'
      )
    }

    if (haDiff > 0.15) {
      challenges.push(
        '⏳ **Hạ Đình khác biệt**: Một người sẽ phát triển mạnh ở hậu vận (sau 50 tuổi), người kia có thể chậm hơn. ' +
        'Điều này ảnh hưởng đến kế hoạch nghỉ hưu và tuổi già.'
      )
      advice.push(
        '🏡 Lập kế hoạch tài chính và cuộc sống dài hạn một cách cẩn thận. ' +
        'Người có Hạ Đình mạnh sẽ là trụ cột trong giai đoạn cuối đời, hãy tôn trọng vai trò này.'
      )
    }
  }

  // Analyze Ngũ Quan similarity with detailed facial features
  if (scores.nguQuanSimilarity >= 320) {
    strengths.push(
      '💕 **Tướng Phu Thê rõ rệt**: Mắt, mũi, miệng có nhiều điểm tương đồng đáng kinh ngạc. ' +
      'Đây là dấu hiệu cổ điển của "Tướng Phu Thê" - hai người dường như được định mệnh để ở bên nhau. ' +
      'Người xung quanh có thể nhận ra sự giống nhau này ngay lần đầu gặp.'
    )

    // Analyze specific features
    const eyeSimilarity = Math.abs(safeDivide(features1.eyeWidth, features1.faceWidth, 0.2) -
                                   safeDivide(features2.eyeWidth, features2.faceWidth, 0.2))
    const noseSimilarity = Math.abs(safeDivide(features1.noseWidth, features1.faceWidth, 0.2) -
                                    safeDivide(features2.noseWidth, features2.faceWidth, 0.2))
    const mouthSimilarity = Math.abs(safeDivide(features1.mouthWidth, features1.faceWidth, 0.35) -
                                     safeDivide(features2.mouthWidth, features2.faceWidth, 0.35))

    if (eyeSimilarity < 0.02) {
      strengths.push(
        '👁️ **Mắt đồng điệu**: Đôi mắt của cả hai có kích thước và hình dạng rất giống nhau. ' +
        'Trong tướng học, đây là dấu hiệu của việc "nhìn cuộc đời bằng cùng một cặp mắt" - ' +
        'có cùng quan điểm và giá trị sống.'
      )
    }

    if (noseSimilarity < 0.02) {
      strengths.push(
        '👃 **Mũi tương đồng**: Sống mũi và hình dạng mũi giống nhau thể hiện sự tương đồng về lòng tự trọng và cách xử lý tài chính. ' +
        'Đây là cặp đôi có thể dễ dàng đồng thuận trong các quyết định tài chính quan trọng.'
      )
    }

    if (mouthSimilarity < 0.03) {
      strengths.push(
        '👄 **Miệng hài hòa**: Kích thước và hình dạng miệng giống nhau cho thấy cách giao tiếp và thể hiện tình cảm tương đồng. ' +
        'Hai người sẽ dễ dàng hiểu "ngôn ngữ tình yêu" của nhau mà không cần giải thích nhiều.'
      )
    }
  } else if (scores.nguQuanSimilarity >= 240) {
    strengths.push(
      '😊 **Ngũ Quan có sự tương đồng tốt**: Các nét mặt chính bổ sung cho nhau một cách hài hòa. ' +
      'Tuy không giống nhau hoàn toàn, nhưng có sự cân đối tạo nên vẻ đẹp riêng cho cặp đôi.'
    )

    // Check for complementary features
    const eyeRatio1 = safeDivide(features1.eyeDistance, features1.eyeWidth, 2)
    const eyeRatio2 = safeDivide(features2.eyeDistance, features2.eyeWidth, 2)

    if (Math.abs(eyeRatio1 - eyeRatio2) < 0.2) {
      strengths.push(
        '✨ **Khoảng cách mắt cân đối**: Tỷ lệ khoảng cách giữa hai mắt tương tự nhau thể hiện sự cân bằng về cảm xúc. ' +
        'Cả hai có xu hướng xử lý tình cảm theo cách tương đồng.'
      )
    }
  } else if (scores.nguQuanSimilarity < 200) {
    challenges.push(
      '🔄 **Ngũ Quan khác biệt đáng kể**: Các nét mặt chính có nhiều điểm khác nhau. ' +
      'Điều này không nhất thiết là xấu - đôi khi sự khác biệt tạo nên sức hút.'
    )

    // Analyze which features are most different
    const eyeDiff = Math.abs(safeDivide(features1.eyeWidth, features1.faceWidth, 0.2) -
                             safeDivide(features2.eyeWidth, features2.faceWidth, 0.2))
    const noseDiff = Math.abs(safeDivide(features1.noseWidth, features1.faceWidth, 0.2) -
                              safeDivide(features2.noseWidth, features2.faceWidth, 0.2))
    const mouthDiff = Math.abs(safeDivide(features1.mouthWidth, features1.faceWidth, 0.35) -
                               safeDivide(features2.mouthWidth, features2.faceWidth, 0.35))

    if (eyeDiff > 0.05) {
      advice.push(
        '👁️ Đôi mắt khác biệt phản ánh cách nhìn cuộc sống khác nhau. ' +
        'Hãy dành thời gian để hiểu góc nhìn của đối phương - điều người này cho là quan trọng có thể không quan trọng với người kia.'
      )
    }

    if (noseDiff > 0.05) {
      advice.push(
        '💰 Hình dạng mũi khác nhau có thể dẫn đến quan điểm tài chính khác biệt. ' +
        'Thiết lập quy tắc rõ ràng về chi tiêu và tiết kiệm từ sớm để tránh hiểu lầm.'
      )
    }

    if (mouthDiff > 0.06) {
      advice.push(
        '💬 Kích thước miệng khác nhau cho thấy nhu cầu giao tiếp khác nhau - một người có thể nói nhiều, người kia ít nói hơn. ' +
        'Tôn trọng phong cách giao tiếp của nhau và tìm điểm chung.'
      )
    }
  }

  // Analyze overall structure with face shape insights
  if (scores.overallStructure >= 120) {
    if (features1.faceShape === features2.faceShape) {
      strengths.push(
        `🎭 **Khuôn mặt đồng dạng (${features1.faceShape})**: Cả hai cùng hình dạng mặt thể hiện sự đồng điệu sâu sắc về tính cách và cách sống. ` +
        `Đây là dấu hiệu rất tốt trong tướng học - "đồng thanh tương ứng, đồng khí tương cầu".`
      )
    } else {
      strengths.push(
        `🎨 **Khuôn mặt bổ sung hài hòa**: ${features1.faceShape} và ${features2.faceShape} kết hợp tạo nên sự cân bằng thẩm mỹ. ` +
        `Theo tướng học, các dạng mặt này bổ sung cho nhau một cách tự nhiên.`
      )
    }

    // Analyze specific face shape combinations
    if ((features1.faceShape === 'square' || features1.faceShape === 'oblong') &&
        (features2.faceShape === 'oval' || features2.faceShape === 'round')) {
      strengths.push(
        '🏗️ **Sự kết hợp "Cứng-Mềm"**: Khuôn mặt góc cạnh kết hợp với khuôn mặt mềm mại tạo nên đội ngũ hoàn hảo - ' +
        'một người mang tính quyết đoán, người kia mang tính hòa giải.'
      )
    }
  } else if (scores.overallStructure < 100) {
    const symmetryDiff = Math.abs(features1.facialSymmetry - features2.facialSymmetry)
    if (symmetryDiff > 15) {
      challenges.push(
        '🔲 **Độ đối xứng khác biệt**: Một người có khuôn mặt đối xứng cao, người kia thấp hơn. ' +
        'Điều này có thể phản ánh sự khác biệt về tính ổn định và cân bằng nội tâm.'
      )
    }
  }

  // Analyze Yin-Yang balance with detailed personality insights
  const yang1 = calculateYangScore(features1, traits1)
  const yang2 = calculateYangScore(features2, traits2)
  const yangDiff = Math.abs(yang1 - yang2)

  if (scores.yinYangBalance >= 120) {
    if (yangDiff >= 20 && yangDiff <= 50) {
      strengths.push(
        `☯️ **Âm-Dương phối hợp hoàn hảo** (${Math.round(yangDiff)} điểm chênh lệch): ` +
        `Một người mang năng lượng "Dương" (${yang1 > yang2 ? 'Person 1' : 'Person 2'}: ${Math.max(yang1, yang2).toFixed(0)} điểm) - ` +
        `quyết đoán, mạnh mẽ, chủ động. Người kia mang năng lượng "Âm" (${yang1 < yang2 ? 'Person 1' : 'Person 2'}: ${Math.min(yang1, yang2).toFixed(0)} điểm) - ` +
        `mềm mại, linh hoạt, thấu hiểu. Đây chính là sự cân bằng mà tự nhiên tạo ra!`
      )

      // Additional insights based on specific Yang scores
      if (Math.max(yang1, yang2) > 65 && Math.min(yang1, yang2) < 45) {
        strengths.push(
          '🌓 **"Một cứng một mềm"**: Người mang năng lượng Dương sẽ là người đưa ra quyết định và bảo vệ gia đình, ' +
          'trong khi người mang năng lượng Âm sẽ tạo ra sự ấm áp và hòa hợp. Đây là cặp đôi truyền thống lý tưởng.'
        )
      }
    } else if (yangDiff > 50 && yangDiff <= 70) {
      strengths.push(
        '⚡ **Tương phản mạnh mẽ**: Sự khác biệt về năng lượng Âm-Dương rất lớn, tạo nên sức hút mạnh mẽ. ' +
        'Đây có thể là "nam châm hút nhau" - đối lập mạnh mẽ nhưng thu hút không thể cưỡng lại.'
      )
      advice.push(
        '🎭 Với sự tương phản lớn này, quan trọng là phải tôn trọng bản chất của nhau. ' +
        'Đừng cố thay đổi đối phương - hãy học cách làm việc cùng nhau như "bàn tay trái và phải".'
      )
    }
  } else if (scores.yinYangBalance >= 90) {
    strengths.push(
      `⚖️ **Cân bằng năng lượng tốt** (${Math.round(yangDiff)} điểm chênh lệch): ` +
      `Tính cách và năng lượng bổ sung cho nhau một cách hài hòa, không quá giống cũng không quá khác.`
    )
  } else if (scores.yinYangBalance < 70) {
    if (yangDiff < 10) {
      challenges.push(
        `⚪ **Quá giống nhau** (Cả hai ~${Math.round((yang1 + yang2) / 2)} điểm Yang): ` +
        `Cả hai có cùng mức năng lượng Âm-Dương, điều này có thể dẫn đến thiếu sự cân bằng trong mối quan hệ.`
      )

      if (yang1 > 60 && yang2 > 60) {
        challenges.push(
          '🔥 **Cả hai đều "Dương"**: Hai người đều mạnh mẽ, quyết đoán có thể dẫn đến xung đột quyền lực. ' +
          'Cần có người biết nhường nhịn để tránh "núi này cao hơn núi kia".'
        )
        advice.push(
          '👑 Xác định rõ vai trò và lãnh thổ cho mỗi người. Ví dụ: một người phụ trách tài chính, người kia phụ trách giáo dục con cái. ' +
          'Hạn chế can thiệp vào "lãnh thổ" của nhau.'
        )
      } else if (yang1 < 40 && yang2 < 40) {
        challenges.push(
          '🌙 **Cả hai đều "Âm"**: Hai người đều mềm mại, linh hoạt có thể thiếu người đưa ra quyết định cuối cùng. ' +
          'Mối quan hệ có thể thiếu động lực và hướng đi rõ ràng.'
        )
        advice.push(
          '🎯 Trong những quyết định quan trọng, một người cần học cách đứng ra và quyết đoán hơn. ' +
          'Luân phiên vai trò "người quyết định" sẽ giúp cả hai phát triển.'
        )
      }
    } else if (yangDiff > 70) {
      challenges.push(
        `💥 **Quá đối lập** (${Math.round(yangDiff)} điểm chênh lệch): ` +
        `Sự chênh lệch năng lượng Âm-Dương quá lớn có thể gây khó khăn trong giao tiếp và hiểu nhau.`
      )
      advice.push(
        '🌉 Xây dựng "cầu nối" giữa hai thái cực. Người mạnh cần học cách mềm mỏng hơn, ' +
        'người mềm cần học cách kiên quyết hơn. Gặp nhau ở điểm giữa là chìa khóa.'
      )
    }
  }

  // Detailed Personality analysis
  const p1 = traits1.personality
  const p2 = traits2.personality

  // Leadership dynamics
  if (p1.leadership > 70 && p2.leadership > 70) {
    challenges.push(
      `🔥 **Cả hai đều có tính lãnh đạo mạnh** (Person 1: ${p1.leadership.toFixed(0)}, Person 2: ${p2.leadership.toFixed(0)}): ` +
      `Hai "đội trưởng" trong cùng một đội có thể dẫn đến xung đột quyền lực và ai cũng muốn điều hành.`
    )
    advice.push(
      '👑 Chia sẻ quyền lãnh đạo theo lĩnh vực: một người lead công việc, người kia lead gia đình. ' +
      'Trong mỗi cuộc họp quan trọng, chỉ một người có quyền quyết định cuối cùng - luân phiên vai trò này.'
    )
  } else if ((p1.leadership > 70 && p2.leadership < 60) || (p2.leadership > 70 && p1.leadership < 60)) {
    strengths.push(
      `👥 **Cân bằng lãnh đạo lý tưởng**: Một người dẫn dắt (${p1.leadership > 70 ? p1.leadership.toFixed(0) : p2.leadership.toFixed(0)} điểm), ` +
      `một người hỗ trợ (${p1.leadership < 60 ? p1.leadership.toFixed(0) : p2.leadership.toFixed(0)} điểm). ` +
      `Đây là cấu trúc tự nhiên và hiệu quả nhất cho mối quan hệ.`
    )
  }

  // Emotional compatibility
  const emotionalDiff = Math.abs(p1.emotional - p2.emotional)
  if (emotionalDiff < 15) {
    strengths.push(
      `💝 **Cảm xúc đồng điệu** (chênh lệch ${emotionalDiff.toFixed(0)} điểm): ` +
      `Cả hai có mức độ nhạy cảm tương tự, dễ dàng thấu hiểu cảm giác và tâm trạng của nhau.`
    )
  } else if (emotionalDiff > 30) {
    challenges.push(
      `🎭 **Khoảng cách cảm xúc** (chênh lệch ${emotionalDiff.toFixed(0)} điểm): ` +
      `Một người rất nhạy cảm (${Math.max(p1.emotional, p2.emotional).toFixed(0)} điểm), ` +
      `người kia lý trí hơn (${Math.min(p1.emotional, p2.emotional).toFixed(0)} điểm). ` +
      `Điều này có thể gây hiểu lầm - "người này nghĩ quá nhiều", "người kia lạnh lùng".`
    )
    advice.push(
      '🧠❤️ Người lý trí: hãy nhớ rằng cảm xúc của đối phương là thật, không phải "suy nghĩ thái quá". ' +
      'Người nhạy cảm: hiểu rằng đối phương thể hiện tình yêu bằng hành động, không chỉ lời nói.'
    )
  }

  // Creativity vs Practical
  if ((p1.creativity > 70 && p2.practical > 70) || (p2.creativity > 70 && p1.practical > 70)) {
    strengths.push(
      `🚀 **Sáng tạo + Thực tế = Thành công**: ` +
      `Một người là "người mơ mộng" (creativity ${Math.max(p1.creativity, p2.creativity).toFixed(0)}), ` +
      `người kia là "người thực hiện" (practical ${Math.max(p1.practical, p2.practical).toFixed(0)}). ` +
      `Đây là công thức của mọi startup và doanh nghiệp thành công!`
    )
    advice.push(
      '💡 Người sáng tạo: đừng thất vọng khi ý tưởng bị "chặn" - đối phương đang giúp bạn lọc ra ý tưởng khả thi nhất. ' +
      'Người thực tế: đừng dập tắt mọi ý tưởng - hãy giúp đối phương hiện thực hóa chúng!'
    )
  } else if (p1.creativity > 70 && p2.creativity > 70) {
    strengths.push(
      `🎨 **Cặp đôi nghệ sĩ**: Cả hai đều sáng tạo và có tư duy độc đáo. ` +
      `Cuộc sống sẽ không bao giờ nhàm chán nhưng cần có người đứng ra lo việc "đời thường".`
    )
    advice.push(
      '📋 Tuyển một "manager" cho cuộc sống - có thể là một người bạn thực tế hoặc học cách chia sẻ trách nhiệm đời thường.'
    )
  }

  // Sociability analysis
  const socialAvg = (p1.sociability + p2.sociability) / 2
  if (socialAvg > 70) {
    strengths.push(
      `🎉 **Cặp đôi xã giao**: Cả hai đều hướng ngoại và thích kết bạn. ` +
      `Cuộc sống sẽ tràn ngập bạn bè và sự kiện!`
    )
  } else if (socialAvg < 40) {
    strengths.push(
      `🏡 **Yên tĩnh cùng nhau**: Cả hai đều hướng nội và trân trọng thời gian riêng tư. ` +
      `Đây là những người có thể "ngồi yên cùng nhau mà không thấy awkward".`
    )
  } else if (Math.abs(p1.sociability - p2.sociability) > 30) {
    challenges.push(
      `🎭 **Nhu cầu xã giao khác nhau**: Một người thích gặp gỡ (${Math.max(p1.sociability, p2.sociability).toFixed(0)} điểm), ` +
      `người kia thích ở nhà (${Math.min(p1.sociability, p2.sociability).toFixed(0)} điểm).`
    )
    advice.push(
      '⚖️ Cân bằng thời gian: một số buổi tối đi chơi với bạn bè, một số buổi ở nhà yên tĩnh. ' +
      'Đừng ép buộc người hướng nội phải ra ngoài liên tục, cũng đừng giữ người hướng ngoại ở nhà mãi.'
    )
  }

  // Fortune analysis with detailed insights
  const f1 = traits1.fortune
  const f2 = traits2.fortune

  // Love fortune
  const loveAvg = (f1.love + f2.love) / 2
  if (loveAvg > 70) {
    strengths.push(
      `❤️ **Tình duyên thuận lợi** (trung bình ${loveAvg.toFixed(0)} điểm): ` +
      `Cả hai đều có duyên phận tốt trong tình yêu, biết cách yêu thương và duy trì cam kết lâu dài.`
    )
  } else if (loveAvg < 50) {
    challenges.push(
      `💔 **Tình duyên cần rèn luyện** (trung bình ${loveAvg.toFixed(0)} điểm): ` +
      `Một hoặc cả hai có thể gặp khó khăn trong việc thể hiện tình cảm hoặc duy trì mối quan hệ.`
    )
    advice.push(
      '📚 Học về "5 ngôn ngữ tình yêu" (Words of Affirmation, Quality Time, Gifts, Acts of Service, Physical Touch). ' +
      'Mỗi người yêu theo cách riêng - hãy tìm hiểu cách của đối phương!'
    )
  }

  // Career fortune
  if (f1.career > 70 && f2.career > 70) {
    strengths.push(
      `💼 **Power Couple** (Person 1: ${f1.career.toFixed(0)}, Person 2: ${f2.career.toFixed(0)}): ` +
      `Cả hai đều có vận sự nghiệp mạnh, tiềm năng xây dựng "đế chế" cùng nhau!`
    )
    advice.push(
      '⏰ Hai người thành công = hai lịch trình bận rộn. Đặt "date night" cố định mỗi tuần, không được hủy vì công việc. ' +
      'Thành công trong sự nghiệp sẽ vô nghĩa nếu mất đi người bạn đời.'
    )
  } else if ((f1.career > 70 && f2.family > 70) || (f2.career > 70 && f1.family > 70)) {
    strengths.push(
      `⚖️ **Cân bằng Sự nghiệp - Gia đình**: Một người tập trung career, người kia tập trung family. ` +
      `Đây là cách phân chia vai trò hiệu quả và bền vững.`
    )
  }

  // Wealth fortune
  const wealthDiff = Math.abs(f1.wealth - f2.wealth)
  if (f1.wealth > 70 && f2.wealth > 70) {
    strengths.push(
      `💰 **Tài vận tốt**: Cả hai đều có khả năng tạo ra và quản lý tài sản. ` +
      `Tiềm năng trở thành cặp đôi giàu có về cả vật chất lẫn tinh thần.`
    )
  } else if (wealthDiff > 25) {
    challenges.push(
      `💸 **Quan điểm tài chính khác biệt** (chênh lệch ${wealthDiff.toFixed(0)} điểm): ` +
      `Một người có khả năng quản lý tiền tốt, người kia kém hơn hoặc ít quan tâm đến tiền bạc.`
    )
    advice.push(
      '💳 Thiết lập hệ thống tài chính rõ ràng từ sớm: tài khoản chung, tài khoản riêng, ngân sách hàng tháng. ' +
      'Người giỏi tài chính nên dạy đối phương, không nên độc quyền hoàn toàn.'
    )
  }

  // Overall analysis
  let analysis = ''

  if (overallScore >= 800) {
    analysis = `🌟 **Tướng Phu Thê Mạnh Mẽ** (${Math.round(overallScore)}/1000 điểm)\n\n`
    analysis += 'Đây là cặp đôi có độ tương hợp đặc biệt cao theo nguyên tắc nhân tướng học. '
    analysis += 'Khuôn mặt và tướng mạo của hai người bổ sung cho nhau một cách hài hòa tuyệt vời, '
    analysis += 'thể hiện sự đồng điệu sâu sắc về vận mệnh và con đường cuộc đời. '
    analysis += 'Mối quan hệ có tiềm năng phát triển lâu dài, hạnh phúc và thịnh vượng.'
  } else if (overallScore >= 600) {
    analysis = `💫 **Tướng Phu Thê Tốt** (${Math.round(overallScore)}/1000 điểm)\n\n`
    analysis += 'Cặp đôi có nhiều điểm tương đồng đáng kể về nét mặt và tính cách. '
    analysis += 'Có sự kết nối tự nhiên và dễ dàng hiểu nhau. '
    analysis += 'Với sự thấu hiểu và cam kết, mối quan hệ sẽ ngày càng bền vững và sâu đậm.'
  } else if (overallScore >= 400) {
    analysis = `✨ **Tướng Phu Thê Trung Bình** (${Math.round(overallScore)}/1000 điểm)\n\n`
    analysis += 'Độ tương hợp ở mức khá, với một số điểm chung nhưng cũng có những khác biệt rõ rệt. '
    analysis += 'Những khác biệt này không nhất thiết là rào cản - chúng có thể tạo nên sự cân bằng và học hỏi lẫn nhau. '
    analysis += 'Cần giao tiếp cởi mở và học cách trân trọng quan điểm của đối phương.'
  } else {
    analysis = `💭 **Tướng Phu Thê Cần Phát Triển** (${Math.round(overallScore)}/1000 điểm)\n\n`
    analysis += 'Có nhiều khác biệt cơ bản về tướng mạo và xu hướng cuộc sống. '
    analysis += 'Tuy nhiên, hãy nhớ rằng tình yêu thật sự có thể vượt qua mọi khác biệt. '
    analysis += 'Nếu quyết tâm xây dựng mối quan hệ, cần có sự kiên nhẫn, thấu hiểu và nỗ lực lớn từ cả hai phía. '
    analysis += 'Theo nguyên tắc "Tướng do tâm sinh", khi sống cùng nhau lâu năm, hai người sẽ dần trở nên giống nhau hơn.'
  }

  // Add specific compatibility note
  analysis += `\n\n**Chi tiết phân tích:**\n`
  analysis += `- Tam Đình (Vận mệnh 3 giai đoạn): ${scores.tamDinhRatio}/300 điểm\n`
  analysis += `- Ngũ Quan (5 nét chính): ${scores.nguQuanSimilarity}/400 điểm\n`
  analysis += `- Cấu trúc tổng thể: ${scores.overallStructure}/150 điểm\n`
  analysis += `- Cân bằng Âm-Dương: ${scores.yinYangBalance}/150 điểm`

  return {
    strengths,
    challenges,
    advice,
    analysis,
    compatibilityLevel
  }
}

/**
 * Main compatibility calculation function
 * Implements 1000-point scoring system based on traditional physiognomy
 */
export function calculateCompatibility(
  features1: FaceFeatures,
  traits1: PhysiognomyTraits,
  features2: FaceFeatures,
  traits2: PhysiognomyTraits
): CompatibilityResult {
  // Calculate individual components
  const tamDinhRatio = calculateTamDinhRatio(features1, features2)
  const nguQuanSimilarity = calculateNguQuanSimilarity(features1, features2)
  const overallStructure = calculateOverallStructure(features1, features2)
  const yinYangBalance = calculateYinYangBalance(features1, features2, traits1, traits2)

  const categories = {
    tamDinhRatio,
    nguQuanSimilarity,
    overallStructure,
    yinYangBalance,
  }

  // Calculate overall score (sum of all components)
  const overallScore = tamDinhRatio + nguQuanSimilarity + overallStructure + yinYangBalance

  // Generate detailed analysis
  const analysisResult = generateCompatibilityAnalysis(
    features1,
    features2,
    traits1,
    traits2,
    categories,
    overallScore
  )

  return {
    overallScore,
    categories,
    details: {
      strengths: analysisResult.strengths,
      challenges: analysisResult.challenges,
      advice: analysisResult.advice,
    },
    analysis: analysisResult.analysis,
    compatibilityLevel: analysisResult.compatibilityLevel
  }
}
