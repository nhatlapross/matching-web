/**
 * Physiognomy Analysis
 * Analyzes facial features according to Chinese face reading principles
 */

import { FaceFeatures } from './faceAnalysis'

export interface PhysiognomyTraits {
  // Tính cách (Personality)
  personality: {
    leadership: number // 0-100
    creativity: number
    sociability: number
    determination: number
    intelligence: number
    emotional: number
    practical: number
    adventurous: number
  }

  // Vận mệnh (Fortune)
  fortune: {
    career: number // 0-100
    wealth: number
    love: number
    health: number
    family: number
  }

  // Phân tích chi tiết
  analysis: {
    forehead: string // Trán - Career and intelligence
    eyes: string // Mắt - Personality and emotions
    nose: string // Mũi - Wealth and determination
    mouth: string // Miệng - Communication and relationships
    jaw: string // Hàm - Willpower and longevity
    overall: string // Tổng quan
  }

  // Điểm tổng hợp
  overallScore: number // 0-100
}

/**
 * Analyze forehead (Trán)
 * Represents career success, intelligence, and early life fortune
 */
function analyzeForehead(features: FaceFeatures): {
  score: number
  intelligence: number
  career: number
  description: string
} {
  const { foreheadHeight, foreheadWidth, foreheadRatio } = features

  let score = 50
  let intelligence = 50
  let career = 50
  let description = ''

  // High forehead indicates intelligence and analytical thinking
  if (foreheadRatio > 1.2) {
    intelligence += 30
    career += 20
    description = 'Trán cao rộng, thông minh, suy nghĩ logic và phân tích tốt. Có khả năng lãnh đạo và quyết định sáng suốt.'
  } else if (foreheadRatio > 0.9) {
    intelligence += 15
    career += 10
    description = 'Trán cân đối, thông minh và thực tế. Có khả năng học hỏi tốt và áp dụng vào công việc hiệu quả.'
  } else {
    intelligence += 5
    career += 5
    description = 'Trán thấp, thực tế và hành động. Thích làm việc cụ thể hơn là lý thuyết trừu tượng.'
  }

  // Wide forehead indicates broad thinking
  if (foreheadWidth > features.faceWidth * 0.8) {
    intelligence += 10
    description += ' Tư duy rộng mở, có tầm nhìn xa.'
  }

  score = (intelligence + career) / 2
  return { score, intelligence, career, description }
}

/**
 * Analyze eyes (Mắt)
 * Represents personality, emotions, and interpersonal relationships
 */
function analyzeEyes(features: FaceFeatures): {
  score: number
  emotional: number
  sociability: number
  description: string
} {
  const { eyeWidth, eyeDistance, eyeSymmetry, eyeToFaceRatio } = features

  let score = 50
  let emotional = 50
  let sociability = 50
  let description = ''

  // Large eyes indicate emotional sensitivity and expressiveness
  if (eyeToFaceRatio > 0.15) {
    emotional += 25
    sociability += 20
    description = 'Mắt to, giàu cảm xúc, dễ gần và thân thiện. Có khả năng giao tiếp tốt và thu hút người khác.'
  } else if (eyeToFaceRatio > 0.12) {
    emotional += 15
    sociability += 10
    description = 'Mắt cân đối, cảm xúc ổn định và giao tiếp tốt. Dễ dàng tạo mối quan hệ với người khác.'
  } else {
    emotional += 5
    sociability += 5
    description = 'Mắt nhỏ, thận trọng và kín đáo. Cần thời gian để mở lòng với người khác.'
  }

  // Eye symmetry indicates emotional balance
  if (eyeSymmetry > 0.9) {
    emotional += 15
    description += ' Cân bằng cảm xúc tốt, ổn định tâm lý.'
  } else if (eyeSymmetry > 0.8) {
    emotional += 10
    description += ' Cảm xúc khá ổn định.'
  }

  // Wide eye distance indicates tolerance and openness
  if (eyeDistance > features.faceWidth * 0.4) {
    sociability += 15
    description += ' Thoáng đãng, bao dung và chấp nhận sự khác biệt.'
  } else if (eyeDistance < features.faceWidth * 0.3) {
    description += ' Tập trung, chuyên sâu vào công việc.'
  }

  score = (emotional + sociability) / 2
  return { score, emotional, sociability, description }
}

/**
 * Analyze nose (Mũi)
 * Represents wealth, determination, and middle-age fortune
 */
function analyzeNose(features: FaceFeatures): {
  score: number
  wealth: number
  determination: number
  description: string
} {
  const { noseLength, noseWidth, noseRatio, noseBridgeWidth } = features

  let score = 50
  let wealth = 50
  let determination = 50
  let description = ''

  // High nose bridge indicates confidence and determination
  if (noseRatio > 1.5) {
    determination += 25
    wealth += 15
    description = 'Sống mũi cao, tự tin và quyết đoán. Có khả năng tích lũy tài sản và thành công trong sự nghiệp.'
  } else if (noseRatio > 1.2) {
    determination += 15
    wealth += 10
    description = 'Mũi cân đối, ổn định và vững chắc. Có khả năng tài chính tốt và quản lý tiền bạc khôn ngoan.'
  } else {
    determination += 5
    wealth += 5
    description = 'Mũi thấp, dễ chịu và linh hoạt. Cần học cách quản lý tài chính tốt hơn.'
  }

  // Wide nose tip indicates generosity with money
  if (noseWidth > features.faceWidth * 0.25) {
    wealth += 15
    description += ' Rộng rãi, hào phóng với tiền bạc.'
  } else {
    determination += 10
    description += ' Tiết kiệm và thận trọng với chi tiêu.'
  }

  // Strong nose bridge indicates strong will
  if (noseBridgeWidth > features.faceWidth * 0.1) {
    determination += 15
    description += ' Ý chí mạnh mẽ, kiên định với mục tiêu.'
  }

  score = (wealth + determination) / 2
  return { score, wealth, determination, description }
}

/**
 * Analyze mouth (Miệng)
 * Represents communication, relationships, and late-life fortune
 */
function analyzeMouth(features: FaceFeatures): {
  score: number
  sociability: number
  love: number
  description: string
} {
  const { mouthWidth, lipThickness, mouthToNoseRatio } = features

  let score = 50
  let sociability = 50
  let love = 50
  let description = ''

  // Large mouth indicates expressiveness and boldness
  if (mouthToNoseRatio > 1.8) {
    sociability += 25
    love += 15
    description = 'Miệng rộng, hào phóng và biểu cảm. Giao tiếp tự tin, dễ thu hút sự chú ý của người khác.'
  } else if (mouthToNoseRatio > 1.5) {
    sociability += 15
    love += 10
    description = 'Miệng cân đối, giao tiếp tốt và dễ chịu. Có khả năng duy trì mối quan hệ lâu dài.'
  } else {
    sociability += 5
    love += 5
    description = 'Miệng nhỏ, kín đáo và thận trọng trong lời nói. Cần thời gian để tạo dựng lòng tin.'
  }

  // Thick lips indicate sensuality and emotional depth
  if (lipThickness > features.faceHeight * 0.05) {
    love += 20
    description += ' Giàu cảm xúc, trung thành và quan tâm đến người thân.'
  } else {
    sociability += 10
    description += ' Lý trí, khách quan trong các mối quan hệ.'
  }

  score = (sociability + love) / 2
  return { score, sociability, love, description }
}

/**
 * Analyze jaw and chin (Hàm)
 * Represents willpower, health, and longevity
 */
function analyzeJaw(features: FaceFeatures): {
  score: number
  determination: number
  health: number
  description: string
} {
  const { jawWidth, jawlineDefinition, chinLength } = features

  let score = 50
  let determination = 50
  let health = 50
  let description = ''

  // Strong jawline indicates determination and stamina
  if (jawlineDefinition > 0.05) {
    determination += 25
    health += 20
    description = 'Hàm chắc khỏe, ý chí mạnh mẽ và sức bền cao. Có khả năng vượt qua khó khăn và đạt được mục tiêu.'
  } else if (jawlineDefinition > 0.03) {
    determination += 15
    health += 10
    description = 'Hàm cân đối, kiên định và có sức khỏe tốt. Biết cách cân bằng công việc và cuộc sống.'
  } else {
    determination += 5
    health += 5
    description = 'Hàm nhẹ nhàng, linh hoạt và dễ thích nghi. Cần chú ý đến sức khỏe và thể chất.'
  }

  // Wide jaw indicates practicality
  if (jawWidth > features.faceWidth * 0.8) {
    determination += 15
    description += ' Thực tế, đáng tin cậy và có trách nhiệm.'
  }

  // Long chin indicates longevity
  if (chinLength > features.faceHeight * 0.15) {
    health += 15
    description += ' Sức khỏe tốt, có tuổi thọ cao.'
  }

  score = (determination + health) / 2
  return { score, determination, health, description }
}

/**
 * Safe division helper to prevent NaN
 */
function safeDivide(numerator: number, denominator: number, defaultValue: number = 0): number {
  if (!isFinite(numerator) || !isFinite(denominator) || denominator === 0) {
    return defaultValue
  }
  const result = numerator / denominator
  return isFinite(result) ? result : defaultValue
}

/**
 * Main physiognomy analysis function
 */
export function analyzePhysiognomy(features: FaceFeatures): PhysiognomyTraits {
  const foreheadAnalysis = analyzeForehead(features)
  const eyesAnalysis = analyzeEyes(features)
  const noseAnalysis = analyzeNose(features)
  const mouthAnalysis = analyzeMouth(features)
  const jawAnalysis = analyzeJaw(features)

  // Aggregate personality traits
  const personality = {
    leadership: Math.min(100, foreheadAnalysis.career + 20),
    creativity: Math.min(100, safeDivide(foreheadAnalysis.intelligence + eyesAnalysis.emotional, 2, 50)),
    sociability: Math.min(100, safeDivide(eyesAnalysis.sociability + mouthAnalysis.sociability, 2, 50)),
    determination: Math.min(100, safeDivide(noseAnalysis.determination + jawAnalysis.determination, 2, 50)),
    intelligence: Math.min(100, foreheadAnalysis.intelligence),
    emotional: Math.min(100, eyesAnalysis.emotional),
    practical: Math.min(100, jawAnalysis.determination + 10),
    adventurous: Math.min(100, safeDivide(mouthAnalysis.sociability + noseAnalysis.determination, 2, 50)),
  }

  // Aggregate fortune aspects
  const fortune = {
    career: Math.min(100, foreheadAnalysis.career),
    wealth: Math.min(100, noseAnalysis.wealth),
    love: Math.min(100, safeDivide(eyesAnalysis.sociability + mouthAnalysis.love, 2, 50)),
    health: Math.min(100, jawAnalysis.health),
    family: Math.min(100, safeDivide(mouthAnalysis.love + jawAnalysis.health, 2, 50)),
  }

  // Create analysis descriptions
  const analysis = {
    forehead: foreheadAnalysis.description,
    eyes: eyesAnalysis.description,
    nose: noseAnalysis.description,
    mouth: mouthAnalysis.description,
    jaw: jawAnalysis.description,
    overall: generateOverallAnalysis(features, personality, fortune),
  }

  // Calculate overall score with safe divisions
  const personalityAvg = safeDivide(Object.values(personality).reduce((a, b) => a + b, 0), 8, 50)
  const fortuneAvg = safeDivide(Object.values(fortune).reduce((a, b) => a + b, 0), 5, 50)
  const overallScore = Math.min(
    100,
    safeDivide(
      features.facialHarmony + features.facialSymmetry + features.goldenRatioScore + personalityAvg + fortuneAvg,
      5,
      50
    )
  )

  return {
    personality,
    fortune,
    analysis,
    overallScore,
  }
}

/**
 * Generate overall analysis summary
 */
function generateOverallAnalysis(
  features: FaceFeatures,
  personality: PhysiognomyTraits['personality'],
  fortune: PhysiognomyTraits['fortune']
): string {
  const faceShapeDescriptions: Record<FaceFeatures['faceShape'], string> = {
    oval: 'Khuôn mặt trái xoan (oval) là tướng đẹp, cân đối và hài hòa. Người có khuôn mặt này thường dễ giao tiếp, thân thiện và được nhiều người yêu mến.',
    round: 'Khuôn mặt tròn thể hiện sự trẻ trung, lạc quan và giàu cảm xúc. Người này thường có quan hệ gia đình tốt và được bạn bè quý mến.',
    square: 'Khuôn mặt vuông thể hiện sự mạnh mẽ, quyết đoán và thực tế. Người này thường có ý chí mạnh mẽ và khả năng lãnh đạo tốt.',
    heart: 'Khuôn mặt trái tim thể hiện sự sáng tạo, nhiệt tình và cuốn hút. Người này thường có trí tưởng tượng phong phú và thu hút người khác.',
    oblong: 'Khuôn mặt dài thể hiện sự trưởng thành, trầm tĩnh và suy nghĩ sâu sắc. Người này thường có tầm nhìn xa và khả năng lập kế hoạch tốt.',
    diamond: 'Khuôn mặt kim cương thể hiện sự nổi bật, độc đáo và mạnh mẽ. Người này thường có cá tính riêng biệt và quyết tâm cao.',
  }

  let summary = faceShapeDescriptions[features.faceShape] + '\n\n'

  // Add personality highlights
  const topTrait = Object.entries(personality).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )
  const traitNames: Record<string, string> = {
    leadership: 'khả năng lãnh đạo',
    creativity: 'sáng tạo',
    sociability: 'hòa đồng',
    determination: 'quyết tâm',
    intelligence: 'thông minh',
    emotional: 'cảm xúc phong phú',
    practical: 'thực tế',
    adventurous: 'phiêu lưu',
  }

  summary += `Điểm mạnh nổi bật nhất của bạn là ${traitNames[topTrait[0]]} (${Math.round(topTrait[1])} điểm). `

  // Add fortune highlights
  const topFortune = Object.entries(fortune).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )
  const fortuneNames: Record<string, string> = {
    career: 'sự nghiệp',
    wealth: 'tài lộc',
    love: 'tình duyên',
    health: 'sức khỏe',
    family: 'gia đình',
  }

  summary += `Về vận mệnh, khía cạnh tốt nhất là ${fortuneNames[topFortune[0]]} (${Math.round(topFortune[1])} điểm).\n\n`

  // Add facial harmony assessment
  if (features.facialHarmony > 80) {
    summary +=
      'Ngũ quan hài hòa và cân đối, thể hiện cuộc đời thuận lợi và may mắn.'
  } else if (features.facialHarmony > 60) {
    summary += 'Ngũ quan khá cân đối, cuộc sống ổn định với nhiều cơ hội tốt.'
  } else {
    summary +=
      'Ngũ quan có một số điểm cần cải thiện, nhưng với nỗ lực sẽ đạt được thành công.'
  }

  return summary
}
