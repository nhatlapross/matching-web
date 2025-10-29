/**
 * Face Compatibility Calculator
 * Calculates compatibility between two faces based on physiognomy principles
 */

import { FaceFeatures } from './faceAnalysis'
import { PhysiognomyTraits } from './physiognomy'

export interface CompatibilityResult {
  overallScore: number // 0-100
  categories: {
    physical: number // Tương hợp về hình thể
    personality: number // Tương hợp về tính cách
    fortune: number // Tương hợp về vận mệnh
    balance: number // Sự cân bằng và bổ sung
  }
  details: {
    strengths: string[] // Điểm mạnh trong mối quan hệ
    challenges: string[] // Thách thức cần vượt qua
    advice: string[] // Lời khuyên
  }
  analysis: string // Phân tích chi tiết
}

/**
 * Calculate physical compatibility based on facial features
 */
function calculatePhysicalCompatibility(
  features1: FaceFeatures,
  features2: FaceFeatures
): number {
  let score = 50

  // Face shape compatibility
  const faceShapeCompatibility: Record<string, string[]> = {
    oval: ['round', 'square', 'heart', 'oblong', 'diamond'], // Compatible with all
    round: ['oval', 'square', 'oblong'],
    square: ['oval', 'round', 'heart'],
    heart: ['oval', 'square', 'diamond'],
    oblong: ['oval', 'round', 'diamond'],
    diamond: ['oval', 'heart', 'oblong'],
  }

  if (faceShapeCompatibility[features1.faceShape]?.includes(features2.faceShape)) {
    score += 15
  }

  // Facial harmony compatibility (similar harmony levels work well)
  const harmonyDiff = Math.abs(features1.facialHarmony - features2.facialHarmony)
  score += Math.max(0, 15 - harmonyDiff / 5)

  // Facial symmetry (both high or both moderate is good)
  const symmetryDiff = Math.abs(features1.facialSymmetry - features2.facialSymmetry)
  score += Math.max(0, 10 - symmetryDiff / 5)

  // Golden ratio (similar proportions are attractive together)
  const goldenRatioDiff = Math.abs(
    features1.goldenRatioScore - features2.goldenRatioScore
  )
  score += Math.max(0, 10 - goldenRatioDiff / 5)

  return Math.min(100, score)
}

/**
 * Calculate personality compatibility
 */
function calculatePersonalityCompatibility(
  traits1: PhysiognomyTraits,
  traits2: PhysiognomyTraits
): number {
  let score = 50
  const p1 = traits1.personality
  const p2 = traits2.personality

  // Leadership balance (one leader + one supportive = good)
  if (
    (p1.leadership > 70 && p2.leadership < 60) ||
    (p2.leadership > 70 && p1.leadership < 60)
  ) {
    score += 15
  } else if (p1.leadership > 70 && p2.leadership > 70) {
    score -= 10 // Both strong leaders may conflict
  }

  // Emotional compatibility (similar emotional levels work well)
  const emotionalDiff = Math.abs(p1.emotional - p2.emotional)
  score += Math.max(0, 10 - emotionalDiff / 5)

  // Sociability balance
  const sociabilitySum = p1.sociability + p2.sociability
  if (sociabilitySum > 130 && sociabilitySum < 160) {
    score += 10 // Both social but not excessive
  } else if (sociabilitySum < 100) {
    score += 5 // Both introverted can work
  }

  // Creativity + Practical balance
  if (
    (p1.creativity > 70 && p2.practical > 70) ||
    (p2.creativity > 70 && p1.practical > 70)
  ) {
    score += 15 // Creative + practical = balanced partnership
  }

  // Determination compatibility (similar levels are good)
  const determinationDiff = Math.abs(p1.determination - p2.determination)
  score += Math.max(0, 10 - determinationDiff / 5)

  return Math.min(100, score)
}

/**
 * Calculate fortune compatibility
 */
function calculateFortuneCompatibility(
  traits1: PhysiognomyTraits,
  traits2: PhysiognomyTraits
): number {
  let score = 50
  const f1 = traits1.fortune
  const f2 = traits2.fortune

  // Career compatibility (both strong or complementary)
  if (f1.career > 70 && f2.career > 70) {
    score += 15 // Power couple
  } else if ((f1.career > 70 && f2.family > 70) || (f2.career > 70 && f1.family > 70)) {
    score += 10 // Career + family balance
  }

  // Wealth compatibility (similar levels = similar lifestyle)
  const wealthDiff = Math.abs(f1.wealth - f2.wealth)
  score += Math.max(0, 15 - wealthDiff / 5)

  // Love compatibility (both should have high love potential)
  const loveAvg = (f1.love + f2.love) / 2
  score += Math.max(0, (loveAvg - 50) / 2)

  // Health compatibility (both healthy = happy relationship)
  const healthAvg = (f1.health + f2.health) / 2
  score += Math.max(0, (healthAvg - 50) / 3)

  return Math.min(100, score)
}

/**
 * Calculate balance and complementarity
 */
function calculateBalance(
  traits1: PhysiognomyTraits,
  traits2: PhysiognomyTraits
): number {
  let score = 50

  // Check if strengths complement each other
  const p1 = traits1.personality
  const p2 = traits2.personality

  // Complementary strengths (different peak traits)
  const p1Max = Math.max(...Object.values(p1))
  const p2Max = Math.max(...Object.values(p2))
  const p1MaxTrait = Object.entries(p1).find(([_, v]) => v === p1Max)?.[0]
  const p2MaxTrait = Object.entries(p2).find(([_, v]) => v === p2Max)?.[0]

  if (p1MaxTrait !== p2MaxTrait) {
    score += 20 // Different strengths = complementary
  }

  // Overall trait balance
  const p1Avg = Object.values(p1).reduce((a, b) => a + b) / 8
  const p2Avg = Object.values(p2).reduce((a, b) => a + b) / 8
  const avgDiff = Math.abs(p1Avg - p2Avg)
  score += Math.max(0, 15 - avgDiff / 5)

  // Fortune balance
  const f1Avg = Object.values(traits1.fortune).reduce((a, b) => a + b) / 5
  const f2Avg = Object.values(traits2.fortune).reduce((a, b) => a + b) / 5
  const fortuneDiff = Math.abs(f1Avg - f2Avg)
  score += Math.max(0, 15 - fortuneDiff / 5)

  return Math.min(100, score)
}

/**
 * Generate detailed compatibility analysis
 */
function generateCompatibilityAnalysis(
  features1: FaceFeatures,
  features2: FaceFeatures,
  traits1: PhysiognomyTraits,
  traits2: PhysiognomyTraits,
  scores: CompatibilityResult['categories']
): {
  strengths: string[]
  challenges: string[]
  advice: string[]
  analysis: string
} {
  const strengths: string[] = []
  const challenges: string[] = []
  const advice: string[] = []

  // Analyze physical compatibility
  if (scores.physical > 70) {
    strengths.push(
      'Hài hòa về ngoại hình và cảm giác thẩm mỹ, dễ thu hút nhau từ cái nhìn đầu tiên'
    )
  }

  // Analyze personality compatibility
  const p1 = traits1.personality
  const p2 = traits2.personality

  if (p1.leadership > 70 && p2.leadership < 60) {
    strengths.push(
      'Một người lãnh đạo, một người hỗ trợ - sự cân bằng hoàn hảo trong mối quan hệ'
    )
  } else if (p1.leadership > 70 && p2.leadership > 70) {
    challenges.push('Cả hai đều có tính lãnh đạo mạnh, cần học cách nhường nhịn và lắng nghe')
    advice.push('Hãy phân chia rõ vai trò và trách nhiệm, tôn trọng quyết định của nhau')
  }

  if (Math.abs(p1.emotional - p2.emotional) < 15) {
    strengths.push('Cùng mức độ cảm xúc, dễ hiểu và chia sẻ cảm giác với nhau')
  } else if (Math.abs(p1.emotional - p2.emotional) > 30) {
    challenges.push('Khác biệt về cảm xúc, một người nhạy cảm, một người lý trí')
    advice.push('Người lý trí cần học cách thấu hiểu cảm xúc, người nhạy cảm cần học cách bình tĩnh')
  }

  if ((p1.creativity > 70 && p2.practical > 70) || (p2.creativity > 70 && p1.practical > 70)) {
    strengths.push('Sáng tạo kết hợp thực tế - đội ngũ hoàn hảo để đạt được mục tiêu')
  }

  // Analyze fortune compatibility
  const f1 = traits1.fortune
  const f2 = traits2.fortune

  if (f1.career > 70 && f2.career > 70) {
    strengths.push('Cả hai đều tập trung vào sự nghiệp, có thể xây dựng đế chế chung')
    advice.push('Đừng quên dành thời gian cho nhau giữa lịch trình bận rộn')
  }

  const loveAvg = (f1.love + f2.love) / 2
  if (loveAvg > 70) {
    strengths.push('Tình duyên tốt, biết cách yêu thương và quan tâm đến nhau')
  } else if (loveAvg < 50) {
    challenges.push('Cần học cách thể hiện tình cảm và quan tâm đến đối phương')
    advice.push('Hãy dành thời gian để hiểu ngôn ngữ tình yêu của nhau')
  }

  // Overall analysis
  let analysis = ''

  if (scores.overallScore > 80) {
    analysis = `Đây là cặp đôi có độ tương hợp rất cao (${Math.round(scores.overallScore)} điểm). `
    analysis += 'Khuôn mặt và tướng mạo bổ sung cho nhau một cách hài hòa, tạo nên sự cân bằng hoàn hảo. '
    analysis += 'Mối quan hệ có tiềm năng phát triển lâu dài và hạnh phúc.'
  } else if (scores.overallScore > 65) {
    analysis = `Cặp đôi có độ tương hợp tốt (${Math.round(scores.overallScore)} điểm). `
    analysis += 'Có nhiều điểm chung và bổ sung cho nhau. '
    analysis += 'Với sự thấu hiểu và nỗ lực, mối quan hệ sẽ ngày càng bền vững.'
  } else if (scores.overallScore > 50) {
    analysis = `Độ tương hợp ở mức khá (${Math.round(scores.overallScore)} điểm). `
    analysis += 'Có một số khác biệt cần điều chỉnh, nhưng không phải là rào cản lớn. '
    analysis += 'Cần giao tiếp cởi mở và học cách chấp nhận sự khác biệt của nhau.'
  } else {
    analysis = `Độ tương hợp cần cải thiện (${Math.round(scores.overallScore)} điểm). `
    analysis += 'Có nhiều khác biệt về tính cách và quan điểm sống. '
    analysis += 'Nếu quyết tâm xây dựng mối quan hệ, cần có sự kiên nhẫn và nỗ lực lớn từ cả hai phía.'
  }

  // Add face shape compatibility note
  analysis += `\n\nKhuôn mặt ${features1.faceShape} và ${features2.faceShape} `
  const faceShapeCompatibility: Record<string, string[]> = {
    oval: ['round', 'square', 'heart', 'oblong', 'diamond'],
    round: ['oval', 'square', 'oblong'],
    square: ['oval', 'round', 'heart'],
    heart: ['oval', 'square', 'diamond'],
    oblong: ['oval', 'round', 'diamond'],
    diamond: ['oval', 'heart', 'oblong'],
  }

  if (faceShapeCompatibility[features1.faceShape]?.includes(features2.faceShape)) {
    analysis += 'tạo thành sự kết hợp hài hòa về mặt thẩm mỹ.'
  } else if (features1.faceShape === features2.faceShape) {
    analysis += 'giống nhau, thể hiện sự đồng điệu và hiểu nhau.'
  } else {
    analysis += 'có sự khác biệt, tạo nên sự độc đáo cho cặp đôi.'
  }

  return { strengths, challenges, advice, analysis }
}

/**
 * Main compatibility calculation function
 */
export function calculateCompatibility(
  features1: FaceFeatures,
  traits1: PhysiognomyTraits,
  features2: FaceFeatures,
  traits2: PhysiognomyTraits
): CompatibilityResult {
  const physical = calculatePhysicalCompatibility(features1, features2)
  const personality = calculatePersonalityCompatibility(traits1, traits2)
  const fortune = calculateFortuneCompatibility(traits1, traits2)
  const balance = calculateBalance(traits1, traits2)

  const categories = {
    physical,
    personality,
    fortune,
    balance,
  }

  // Calculate overall score (weighted average)
  const overallScore =
    physical * 0.2 + personality * 0.35 + fortune * 0.25 + balance * 0.2

  // Generate detailed analysis
  const details = generateCompatibilityAnalysis(
    features1,
    features2,
    traits1,
    traits2,
    { ...categories, overallScore }
  )

  return {
    overallScore,
    categories,
    details: {
      strengths: details.strengths,
      challenges: details.challenges,
      advice: details.advice,
    },
    analysis: details.analysis,
  }
}
