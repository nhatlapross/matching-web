/**
 * Physiognomy Analysis
 * Analyzes facial features according to Chinese face reading principles
 */

import { type FaceFeatures } from './faceAnalysis'

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

  // Phân tích chi tiết Ngũ Quan (Five Features)
  nguQuan: {
    eyes: string // Mắt (Giám Sát Quan) - Personality and emotions
    eyebrows: string // Lông Mày (Bảo Thọ Quan) - Relationships and temperament
    nose: string // Mũi (Thẩm Biện Quan) - Wealth and determination
    mouth: string // Miệng (Xuất Nạp Quan) - Communication and relationships
    ears: string // Tai (Thái Thính Quan) - Longevity and early fortune
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
  const { foreheadHeight, foreheadWidth, foreheadRatio, faceHeight, faceWidth } = features

  let score = 50
  let intelligence = 50
  let career = 50
  let descriptions: string[] = []

  // Calculate specific measurements for more unique analysis
  const foreheadArea = foreheadHeight * foreheadWidth
  const faceArea = faceHeight * faceWidth
  const foreheadAreaRatio = safeDivide(foreheadArea, faceArea, 0.3)
  const widthRatio = safeDivide(foreheadWidth, faceWidth, 0.8)

  // Very detailed forehead height analysis (7 levels)
  if (foreheadRatio > 1.4) {
    intelligence += 35
    career += 25
    descriptions.push(`**Trán rất cao** (${foreheadRatio.toFixed(2)}:1, cao hơn ~${((foreheadRatio - 1) * 100).toFixed(0)}% so với chiều rộng) - Trí tuệ xuất chúng, tư duy triết lý sâu sắc.`)
    descriptions.push('Khả năng phân tích phức tạp vượt trội, thích nghiên cứu lý thuyết và chiến lược dài hạn. Phù hợp với vai trò lãnh đạo cấp cao, học giả, hoặc chiến lược gia.')
  } else if (foreheadRatio > 1.2) {
    intelligence += 30
    career += 20
    descriptions.push(`**Trán cao** (${foreheadRatio.toFixed(2)}:1) - Thông minh, logic mạnh và khả năng lập kế hoạch tốt.`)
    descriptions.push('Có tầm nhìn xa, giỏi quản lý và phù hợp với công việc đòi hỏi tư duy phân tích như quản lý, kỹ sư, hoặc nghiên cứu.')
  } else if (foreheadRatio > 1.0) {
    intelligence += 20
    career += 15
    descriptions.push(`**Trán hơi cao** (${foreheadRatio.toFixed(2)}:1) - Cân bằng tốt giữa lý thuyết và thực hành.`)
    descriptions.push('Học hỏi nhanh và biết áp dụng kiến thức vào thực tế. Linh hoạt trong nhiều môi trường công việc.')
  } else if (foreheadRatio > 0.8) {
    intelligence += 15
    career += 10
    descriptions.push(`**Trán cân đối** (${foreheadRatio.toFixed(2)}:1) - Thông minh thực tế, ưa thích hành động.`)
    descriptions.push('Giỏi giải quyết vấn đề cụ thể, thích "làm" hơn "nghĩ". Phù hợp với công việc kỹ thuật, thực hành.')
  } else if (foreheadRatio > 0.6) {
    intelligence += 10
    career += 8
    descriptions.push(`**Trán hơi thấp** (${foreheadRatio.toFixed(2)}:1) - Rất thực tế, quyết đoán và hành động nhanh.`)
    descriptions.push('Trực giác tốt, thích công việc kỹ thuật hoặc thủ công. Không thích lý thuyết dài dòng.')
  } else {
    intelligence += 5
    career += 5
    descriptions.push(`**Trán thấp** (${foreheadRatio.toFixed(2)}:1) - Rất thiên về hành động và thực tế.`)
    descriptions.push('Trực giác mạnh, phản ứng nhanh. Phù hợp với công việc đòi hỏi kỹ năng thực hành và quyết định tức thì.')
  }

  // Detailed width analysis
  if (widthRatio > 0.95) {
    intelligence += 15
    career += 10
    descriptions.push(`Trán rất rộng (${(widthRatio * 100).toFixed(0)}% chiều rộng mặt) - Tư duy đa chiều, có khả năng xem xét nhiều góc độ đồng thời và tầm nhìn chiến lược.`)
  } else if (widthRatio > 0.85) {
    intelligence += 10
    career += 8
    descriptions.push(`Trán rộng (${(widthRatio * 100).toFixed(0)}% chiều rộng mặt) - Tư duy mở rộng, linh hoạt trong giải quyết vấn đề.`)
  } else if (widthRatio > 0.70) {
    intelligence += 8
    descriptions.push(`Trán cân đối (${(widthRatio * 100).toFixed(0)}% chiều rộng mặt) - Tư duy có phương pháp và tập trung.`)
  } else {
    intelligence += 5
    descriptions.push(`Trán hẹp (${(widthRatio * 100).toFixed(0)}% chiều rộng mặt) - Tập trung sâu vào một chuyên môn, trở thành chuyên gia trong lĩnh vực hẹp.`)
  }

  // Area analysis adds even more specificity
  if (foreheadAreaRatio > 0.38) {
    intelligence += 10
    descriptions.push(`Diện tích trán chiếm ${(foreheadAreaRatio * 100).toFixed(0)}% khuôn mặt - khả năng tư duy trừu tượng và sáng tạo cao.`)
  } else if (foreheadAreaRatio > 0.28) {
    career += 5
    descriptions.push(`Diện tích trán cân đối (${(foreheadAreaRatio * 100).toFixed(0)}% khuôn mặt).`)
  } else {
    career += 10
    descriptions.push(`Diện tích trán nhỏ gọn (${(foreheadAreaRatio * 100).toFixed(0)}% khuôn mặt) - thích kết quả ngay lập tức hơn là quy hoạch dài hạn.`)
  }

  score = (intelligence + career) / 2
  return { score, intelligence, career, description: descriptions.join(' ') }
}

/**
 * Analyze eyebrows (Lông Mày - Bảo Thọ Quan)
 * Represents relationships, temperament, and longevity
 */
function analyzeEyebrows(features: FaceFeatures): {
  score: number
  relationships: number
  temperament: number
  description: string
} {
  // Note: MediaPipe doesn't provide direct eyebrow measurements, so we infer from forehead and eye data
  const { foreheadHeight, eyeDistance, facialSymmetry } = features

  let score = 50
  let relationships = 50
  let temperament = 50
  let description = ''

  // Eyebrow position relative to eyes (inferred from forehead height)
  // Higher eyebrows (more forehead space) indicate planning and thoughtfulness
  const eyebrowSpacing = foreheadHeight / features.faceHeight
  if (eyebrowSpacing > 0.35) {
    temperament += 20
    relationships += 15
    description = 'Lông mày cao và rộng, tính cách điềm tĩnh và suy nghĩ kỹ càng. Có khả năng duy trì mối quan hệ lâu dài và sâu sắc.'
  } else if (eyebrowSpacing > 0.30) {
    temperament += 15
    relationships += 10
    description = 'Lông mày cân đối, tính cách hòa nhã và dễ gần. Giao tiếp tốt và có nhiều bạn bè.'
  } else {
    temperament += 10
    relationships += 5
    description = 'Lông mày thấp, tính cách quyết đoán và hành động nhanh. Thẳng thắn trong giao tiếp.'
  }

  // Eyebrow symmetry (using facial symmetry as proxy)
  if (facialSymmetry > 85) {
    relationships += 15
    description += ' Cân bằng trong các mối quan hệ, biết lắng nghe và chia sẻ.'
  } else if (facialSymmetry > 70) {
    relationships += 10
    description += ' Khá ổn định trong tình cảm và quan hệ xã hội.'
  }

  // Eyebrow width (inferred from eye distance)
  if (eyeDistance > features.faceWidth * 0.38) {
    temperament += 15
    description += ' Rộng lượng, bao dung và ít khi nổi giận.'
  } else if (eyeDistance < features.faceWidth * 0.32) {
    temperament += 10
    description += ' Tập trung và quyết đoán trong công việc.'
  }

  score = (relationships + temperament) / 2
  return { score, relationships, temperament, description }
}

/**
 * Analyze eyes (Mắt - Giám Sát Quan)
 * Represents personality, emotions, and "nhãn thần" (eye spirit/brightness)
 * This is the MOST IMPORTANT feature in physiognomy
 */
function analyzeEyes(features: FaceFeatures): {
  score: number
  emotional: number
  sociability: number
  nhanThan: number // Eye spirit/brightness
  description: string
} {
  const { eyeWidth, eyeDistance, eyeSymmetry, eyeToFaceRatio, facialSymmetry } = features

  let score = 50
  let emotional = 50
  let sociability = 50
  let nhanThan = 50 // Eye spirit - most important in traditional physiognomy
  let description = ''

  // "Nhãn thần" (eye spirit) - approximated by eye symmetry and overall facial harmony
  // In traditional physiognomy, bright, clear eyes with good spirit are most valued
  if (eyeSymmetry > 0.95 && facialSymmetry > 85) {
    nhanThan += 35
    description = '👁️ **Nhãn thần tốt** - Mắt sáng, có thần. Đây là dấu hiệu của trí tuệ minh mẫn, tâm hồn trong sáng và khả năng thấu hiểu người khác xuất sắc. '
  } else if (eyeSymmetry > 0.85 && facialSymmetry > 70) {
    nhanThan += 20
    description = 'Mắt có thần khá tốt, tinh thần minh mẫn và tỉnh táo. '
  } else {
    nhanThan += 10
    description = 'Mắt cần rèn luyện thêm sự tập trung và tinh thần. '
  }

  // Eye size and shape
  if (eyeToFaceRatio > 0.15) {
    emotional += 25
    sociability += 20
    description += 'Mắt to, giàu cảm xúc, dễ gần và thân thiện. Có khả năng thu hút và giao tiếp tốt với người khác.'
  } else if (eyeToFaceRatio > 0.12) {
    emotional += 15
    sociability += 10
    description += 'Mắt cân đối, cảm xúc ổn định. Dễ dàng tạo mối quan hệ tin cậy với người khác.'
  } else {
    emotional += 5
    sociability += 5
    description += 'Mắt nhỏ, thận trọng và quan sát kỹ. Cần thời gian để tin tưởng người khác.'
  }

  // Eye symmetry indicates emotional balance
  if (eyeSymmetry > 0.9) {
    emotional += 15
    description += ' Cân bằng cảm xúc tốt, ổn định tâm lý và quyết định sáng suốt.'
  } else if (eyeSymmetry > 0.8) {
    emotional += 10
    description += ' Cảm xúc khá ổn định trong hầu hết các tình huống.'
  }

  // Eye distance indicates tolerance and thinking style
  if (eyeDistance > features.faceWidth * 0.4) {
    sociability += 15
    nhanThan += 10
    description += ' Thoáng đãng, bao dung và có tư duy chiến lược.'
  } else if (eyeDistance < features.faceWidth * 0.3) {
    nhanThan += 10
    description += ' Tập trung cao độ, chuyên sâu và chi tiết trong công việc.'
  }

  score = (emotional + sociability + nhanThan) / 3
  return { score, emotional, sociability, nhanThan, description }
}

/**
 * Analyze nose (Mũi - Thẩm Biện Quan)
 * Represents wealth, determination, and middle-age fortune
 * "Mũi là Cung Tài Bạch" - Most important for wealth fortune
 */
function analyzeNose(features: FaceFeatures): {
  score: number
  wealth: number
  determination: number
  description: string
} {
  const { noseLength, noseWidth, noseRatio, noseBridgeWidth, faceWidth, faceHeight } = features

  let score = 50
  let wealth = 50
  let determination = 50
  let descriptions: string[] = []

  // Calculate detailed nose metrics
  const noseWidthRatio = safeDivide(noseWidth, faceWidth, 0.2)
  const noseBridgeRatio = safeDivide(noseBridgeWidth, faceWidth, 0.08)
  const noseToFaceRatio = safeDivide(noseLength, faceHeight, 0.15)

  // Detailed nose height/length analysis (7 levels)
  if (noseRatio > 2.0) {
    determination += 30
    wealth += 20
    descriptions.push(`**Sống mũi rất cao** (tỷ lệ ${noseRatio.toFixed(2)}:1, cao gấp đôi chiều rộng) - Tự tin vượt trội, tham vọng lớn và quyết tâm mạnh mẽ.`)
    descriptions.push('Khả năng tích lũy tài sản xuất sắc, có thể trở thành doanh nhân hoặc lãnh đạo thành công. Tuy nhiên cần chú ý đến sự kiêu ngạo.')
  } else if (noseRatio > 1.6) {
    determination += 25
    wealth += 18
    descriptions.push(`**Sống mũi cao** (tỷ lệ ${noseRatio.toFixed(2)}:1) - Rất tự tin, quyết đoán và có khả năng tài chính tốt.`)
    descriptions.push('Tích lũy tài sản ổn định, có khả năng quản lý tiền bạc khôn ngoan và thành công trong sự nghiệp.')
  } else if (noseRatio > 1.3) {
    determination += 18
    wealth += 15
    descriptions.push(`**Sống mũi hơi cao** (tỷ lệ ${noseRatio.toFixed(2)}:1) - Tự tin, ổn định và vững chắc.`)
    descriptions.push('Có khả năng tài chính khá tốt, biết cách đầu tư và tiết kiệm hợp lý.')
  } else if (noseRatio > 1.0) {
    determination += 12
    wealth += 10
    descriptions.push(`**Mũi cân đối** (tỷ lệ ${noseRatio.toFixed(2)}:1) - Hài hòa, cân bằng và thực tế.`)
    descriptions.push('Quản lý tài chính ổn định, không quá tham vọng nhưng cũng không thiếu thốn.')
  } else if (noseRatio > 0.8) {
    determination += 8
    wealth += 7
    descriptions.push(`**Mũi hơi thấp** (tỷ lệ ${noseRatio.toFixed(2)}:1) - Dễ chịu, linh hoạt và không quá quan tâm đến tiền bạc.`)
    descriptions.push('Cần học cách quản lý tài chính tốt hơn, tránh chi tiêu bốc đồng.')
  } else {
    determination += 5
    wealth += 5
    descriptions.push(`**Mũi thấp** (tỷ lệ ${noseRatio.toFixed(2)}:1) - Rất dễ chịu, ít tham vọng về vật chất.`)
    descriptions.push('Ưu tiên hạnh phúc và quan hệ hơn là tiền bạc. Cần người khác hỗ trợ về tài chính.')
  }

  // Detailed nose width analysis
  if (noseWidthRatio > 0.28) {
    wealth += 18
    descriptions.push(`Đầu mũi rất rộng (${(noseWidthRatio * 100).toFixed(0)}% chiều rộng mặt) - Rất hào phóng, rộng rãi với tiền bạc.`)
    descriptions.push('Dễ kiếm tiền nhưng cũng dễ tiêu tiền. Cần chú ý kiểm soát chi tiêu.')
  } else if (noseWidthRatio > 0.23) {
    wealth += 12
    determination += 5
    descriptions.push(`Đầu mũi rộng (${(noseWidthRatio * 100).toFixed(0)}% chiều rộng mặt) - Hào phóng và thích chia sẻ.`)
  } else if (noseWidthRatio > 0.18) {
    determination += 10
    descriptions.push(`Đầu mũi cân đối (${(noseWidthRatio * 100).toFixed(0)}% chiều rộng mặt) - Cân bằng giữa chi tiêu và tiết kiệm.`)
  } else {
    determination += 15
    wealth += 8
    descriptions.push(`Đầu mũi nhỏ gọn (${(noseWidthRatio * 100).toFixed(0)}% chiều rộng mặt) - Rất tiết kiệm, thận trọng với tiền bạc.`)
    descriptions.push('Biết cách tích lũy từng đồng một, nhưng đôi khi quá keo kiệt.')
  }

  // Nose bridge analysis
  if (noseBridgeRatio > 0.12) {
    determination += 18
    descriptions.push(`Sống mũi rất chắc (${(noseBridgeRatio * 100).toFixed(1)}% chiều rộng mặt) - Ý chí sắt đá, không dễ bị lay chuyển.`)
    descriptions.push('Kiên định với mục tiêu, có thể vượt qua mọi khó khăn.')
  } else if (noseBridgeRatio > 0.09) {
    determination += 12
    descriptions.push(`Sống mũi chắc khỏe (${(noseBridgeRatio * 100).toFixed(1)}% chiều rộng mặt) - Ý chí mạnh mẽ, kiên định.`)
  } else if (noseBridgeRatio > 0.06) {
    determination += 8
    descriptions.push(`Sống mũi cân đối (${(noseBridgeRatio * 100).toFixed(1)}% chiều rộng mặt) - Ý chí ổn định.`)
  } else {
    determination += 5
    descriptions.push(`Sống mũi nhỏ gọn (${(noseBridgeRatio * 100).toFixed(1)}% chiều rộng mặt) - Linh hoạt, dễ thay đổi quyết định.`)
  }

  // Nose length relative to face
  if (noseToFaceRatio > 0.18) {
    wealth += 10
    descriptions.push(`Chiều dài mũi chiếm ${(noseToFaceRatio * 100).toFixed(0)}% chiều cao mặt - Vận tài lộc trung niên rất tốt.`)
  } else if (noseToFaceRatio < 0.12) {
    descriptions.push(`Mũi tương đối ngắn (${(noseToFaceRatio * 100).toFixed(0)}% chiều cao mặt) - Cần chú ý phát triển sự nghiệp ở tuổi trung niên.`)
  }

  score = (wealth + determination) / 2
  return { score, wealth, determination, description: descriptions.join(' ') }
}

/**
 * Analyze mouth (Miệng - Xuất Nạp Quan)
 * Represents communication, relationships, and late-life fortune
 */
function analyzeMouth(features: FaceFeatures): {
  score: number
  sociability: number
  love: number
  description: string
} {
  const { mouthWidth, lipThickness, mouthToNoseRatio, faceWidth, faceHeight } = features

  let score = 50
  let sociability = 50
  let love = 50
  let descriptions: string[] = []

  // Calculate detailed mouth metrics
  const mouthWidthRatio = safeDivide(mouthWidth, faceWidth, 0.35)
  const lipThicknessRatio = safeDivide(lipThickness, faceHeight, 0.03)

  // Very detailed mouth size analysis (7 levels)
  if (mouthToNoseRatio > 2.2) {
    sociability += 30
    love += 18
    descriptions.push(`**Miệng rất rộng** (${mouthToNoseRatio.toFixed(2)}:1 so với mũi, rộng ${(mouthWidthRatio * 100).toFixed(0)}% chiều rộng mặt) - Cực kỳ hào phóng, biểu cảm phong phú và thu hút mọi người.`)
    descriptions.push('Giao tiếp rất tự tin và thẳng thắn, dễ trở thành trung tâm trong các cuộc trò chuyện. Tuy nhiên cần cẩn thận với lời nói.')
  } else if (mouthToNoseRatio > 1.9) {
    sociability += 25
    love += 15
    descriptions.push(`**Miệng rộng** (${mouthToNoseRatio.toFixed(2)}:1 so với mũi) - Hào phóng, biểu cảm và thu hút.`)
    descriptions.push('Giao tiếp tốt, dễ tạo ấn tượng và có nhiều bạn bè. Thích chia sẻ và trò chuyện.')
  } else if (mouthToNoseRatio > 1.6) {
    sociability += 18
    love += 12
    descriptions.push(`**Miệng hơi rộng** (${mouthToNoseRatio.toFixed(2)}:1 so với mũi) - Cởi mở, thân thiện và dễ gần.`)
    descriptions.push('Giao tiếp tự nhiên, có khả năng duy trì mối quan hệ tốt.')
  } else if (mouthToNoseRatio > 1.3) {
    sociability += 12
    love += 10
    descriptions.push(`**Miệng cân đối** (${mouthToNoseRatio.toFixed(2)}:1 so với mũi) - Hài hòa, giao tiếp vừa phải.`)
    descriptions.push('Biết khi nào nên nói, khi nào nên im lặng. Duy trì mối quan hệ ổn định.')
  } else if (mouthToNoseRatio > 1.1) {
    sociability += 8
    love += 7
    descriptions.push(`**Miệng hơi nhỏ** (${mouthToNoseRatio.toFixed(2)}:1 so với mũi) - Kín đáo, thận trọng trong lời nói.`)
    descriptions.push('Suy nghĩ kỹ trước khi nói, ít nói nhưng ý nghĩa. Cần thời gian để tin tưởng.')
  } else {
    sociability += 5
    love += 5
    descriptions.push(`**Miệng nhỏ** (${mouthToNoseRatio.toFixed(2)}:1 so với mũi) - Rất kín đáo, ít nói.`)
    descriptions.push('Thích lắng nghe hơn là nói, khó mở lòng. Quan hệ ít nhưng sâu sắc.')
  }

  // Detailed lip thickness analysis
  if (lipThicknessRatio > 0.06) {
    love += 25
    descriptions.push(`Môi rất dầy (${(lipThicknessRatio * 100).toFixed(1)}% chiều cao mặt) - Cực kỳ giàu cảm xúc, nồng nhiệt và trung thành.`)
    descriptions.push('Rất quan tâm đến người thân, yêu đương sâu đậm. Ham muốn tình cảm cao.')
  } else if (lipThicknessRatio > 0.045) {
    love += 20
    descriptions.push(`Môi dầy (${(lipThicknessRatio * 100).toFixed(1)}% chiều cao mặt) - Giàu cảm xúc, ấm áp và quan tâm người khác.`)
    descriptions.push('Trung thành trong tình yêu, thích chăm sóc người thân.')
  } else if (lipThicknessRatio > 0.03) {
    love += 12
    sociability += 5
    descriptions.push(`Môi cân đối (${(lipThicknessRatio * 100).toFixed(1)}% chiều cao mặt) - Cân bằng giữa cảm xúc và lý trí.`)
  } else if (lipThicknessRatio > 0.02) {
    sociability += 15
    love += 5
    descriptions.push(`Môi mỏng (${(lipThicknessRatio * 100).toFixed(1)}% chiều cao mặt) - Lý trí, khách quan và thực tế.`)
    descriptions.push('Không quá bộc lộ cảm xúc, thích logic hơn tình cảm.')
  } else {
    sociability += 18
    descriptions.push(`Môi rất mỏng (${(lipThicknessRatio * 100).toFixed(1)}% chiều cao mặt) - Rất lý trí, kiềm chế cảm xúc.`)
    descriptions.push('Giao tiếp ngắn gọn, đi thẳng vào vấn đề. Ít bộc lộ tình cảm.')
  }

  // Mouth width relative to face
  if (mouthWidthRatio > 0.42) {
    sociability += 12
    descriptions.push(`Miệng chiếm ${(mouthWidthRatio * 100).toFixed(0)}% chiều rộng mặt - Rất cởi mở và thích giao tiếp.`)
  } else if (mouthWidthRatio < 0.30) {
    descriptions.push(`Miệng chiếm ${(mouthWidthRatio * 100).toFixed(0)}% chiều rộng mặt - Khá kín đáo và chọn lọc bạn bè.`)
  }

  score = (sociability + love) / 2
  return { score, sociability, love, description: descriptions.join(' ') }
}

/**
 * Analyze jaw and chin (Hàm)
 * Represents willpower, health, and longevity (Hạ Đình)
 */
function analyzeJaw(features: FaceFeatures): {
  score: number
  determination: number
  health: number
  description: string
} {
  const { jawWidth, jawlineDefinition, chinLength, faceWidth, faceHeight } = features

  let score = 50
  let determination = 50
  let health = 50
  let descriptions: string[] = []

  // Calculate detailed jaw metrics
  const jawWidthRatio = safeDivide(jawWidth, faceWidth, 0.75)
  const chinLengthRatio = safeDivide(chinLength, faceHeight, 0.12)
  const jawDefinitionLevel = jawlineDefinition * 100 // Convert to percentage

  // Very detailed jawline definition analysis (7 levels)
  if (jawlineDefinition > 0.08) {
    determination += 30
    health += 25
    descriptions.push(`**Hàm rất chắc khỏe** (độ rõ nét ${jawDefinitionLevel.toFixed(1)}%) - Ý chí sắt đá, sức bền vượt trội và sức khỏe xuất sắc.`)
    descriptions.push('Có khả năng vượt qua mọi khó khăn, không bao giờ bỏ cuộc. Tuổi thọ cao, hậu vận tốt.')
  } else if (jawlineDefinition > 0.06) {
    determination += 25
    health += 20
    descriptions.push(`**Hàm chắc khỏe** (độ rõ nét ${jawDefinitionLevel.toFixed(1)}%) - Ý chí mạnh mẽ, kiên trì và sức khỏe tốt.`)
    descriptions.push('Kiên định với mục tiêu, có thể đạt được thành công lớn. Cuộc sống sau 50 tuổi rất tốt.')
  } else if (jawlineDefinition > 0.04) {
    determination += 18
    health += 15
    descriptions.push(`**Hàm khá chắc** (độ rõ nét ${jawDefinitionLevel.toFixed(1)}%) - Quyết tâm tốt và sức khỏe ổn định.`)
    descriptions.push('Biết cách kiên trì, có sức khỏe và tuổi thọ trung bình đến khá.')
  } else if (jawlineDefinition > 0.025) {
    determination += 12
    health += 10
    descriptions.push(`**Hàm cân đối** (độ rõ nét ${jawDefinitionLevel.toFixed(1)}%) - Cân bằng giữa kiên định và linh hoạt.`)
    descriptions.push('Biết lúc nào cần kiên trì, lúc nào cần thích nghi. Sức khỏe ổn định.')
  } else if (jawlineDefinition > 0.015) {
    determination += 8
    health += 7
    descriptions.push(`**Hàm hơi mềm** (độ rõ nét ${jawDefinitionLevel.toFixed(1)}%) - Linh hoạt, dễ thích nghi nhưng đôi khi thiếu quyết đoán.`)
    descriptions.push('Cần rèn luyện ý chí và chú ý sức khỏe, đặc biệt ở tuổi già.')
  } else {
    determination += 5
    health += 5
    descriptions.push(`**Hàm mềm** (độ rõ nét ${jawDefinitionLevel.toFixed(1)}%) - Rất linh hoạt, dễ bị lay chuyển.`)
    descriptions.push('Cần chú ý đến sức khỏe và rèn luyện ý chí. Hậu vận cần người khác hỗ trợ.')
  }

  // Detailed jaw width analysis
  if (jawWidthRatio > 0.90) {
    determination += 18
    health += 10
    descriptions.push(`Hàm rất rộng (${(jawWidthRatio * 100).toFixed(0)}% chiều rộng mặt) - Cực kỳ thực tế, đáng tin cậy và có trách nhiệm cao.`)
    descriptions.push('Có khả năng chịu đựng và làm việc vất vả. Phù hợp với công việc đòi hỏi sức bền.')
  } else if (jawWidthRatio > 0.80) {
    determination += 15
    health += 8
    descriptions.push(`Hàm rộng (${(jawWidthRatio * 100).toFixed(0)}% chiều rộng mặt) - Thực tế, kiên trì và đáng tin cậy.`)
  } else if (jawWidthRatio > 0.70) {
    determination += 10
    descriptions.push(`Hàm cân đối (${(jawWidthRatio * 100).toFixed(0)}% chiều rộng mặt) - Cân bằng giữa lý tưởng và thực tế.`)
  } else {
    determination += 5
    descriptions.push(`Hàm hẹp (${(jawWidthRatio * 100).toFixed(0)}% chiều rộng mặt) - Ưu tiên tinh thần hơn vật chất.`)
  }

  // Detailed chin length analysis
  if (chinLengthRatio > 0.18) {
    health += 20
    descriptions.push(`Cằm dài (${(chinLengthRatio * 100).toFixed(0)}% chiều cao mặt) - Dấu hiệu của tuổi thọ cao và hậu vận rất tốt.`)
    descriptions.push('Càng về già càng tốt, cuộc sống sau 60 tuổi hanh thông và hạnh phúc.')
  } else if (chinLengthRatio > 0.14) {
    health += 15
    descriptions.push(`Cằm khá dài (${(chinLengthRatio * 100).toFixed(0)}% chiều cao mặt) - Tuổi thọ tốt và hậu vận ổn định.`)
  } else if (chinLengthRatio > 0.10) {
    health += 10
    descriptions.push(`Cằm cân đối (${(chinLengthRatio * 100).toFixed(0)}% chiều cao mặt) - Tuổi thọ trung bình.`)
  } else {
    health += 5
    descriptions.push(`Cằm ngắn (${(chinLengthRatio * 100).toFixed(0)}% chiều cao mặt) - Cần chú ý sức khỏe ở tuổi già.`)
  }

  score = (determination + health) / 2
  return { score, determination, health, description: descriptions.join(' ') }
}

/**
 * Analyze ears (Tai - Thái Thính Quan)
 * Represents longevity, early life fortune, and wisdom
 * Note: MediaPipe has limited ear landmarks, so this is a simplified analysis
 */
function analyzeEars(features: FaceFeatures): {
  score: number
  longevity: number
  earlyFortune: number
  description: string
} {
  // Since MediaPipe doesn't provide detailed ear measurements, we infer from face shape and overall harmony
  const { facialHarmony, facialSymmetry, faceHeight } = features

  let score = 50
  let longevity = 50
  let earlyFortune = 50
  let description = ''

  // In traditional physiognomy, well-proportioned ears indicate good fortune
  // We use overall facial harmony as a proxy
  if (facialHarmony > 80 && facialSymmetry > 80) {
    longevity += 30
    earlyFortune += 25
    description = 'Tai có tướng tốt (suy từ hài hòa khuôn mặt). Tuổi thọ cao, vận may thời niên thiếu tốt đẹp. Có khả năng nghe và tiếp thu kiến thức xuất sắc.'
  } else if (facialHarmony > 65 && facialSymmetry > 65) {
    longevity += 20
    earlyFortune += 15
    description = 'Tai cân đối, sức khỏe tốt và vận may thời trẻ ổn định. Có khả năng học hỏi và tiếp thu thông tin tốt.'
  } else {
    longevity += 10
    earlyFortune += 10
    description = 'Tai cần chú ý sức khỏe và rèn luyện khả năng lắng nghe. Vận may thời niên thiếu có thể có thách thức.'
  }

  // Tall faces often correlate with longer ears in physiognomy
  if (faceHeight > features.faceWidth * 1.4) {
    longevity += 15
    description += ' Tai dài (suy từ mặt dài), dấu hiệu của tuổi thọ và trí tuệ.'
  }

  score = (longevity + earlyFortune) / 2
  return { score, longevity, earlyFortune, description }
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
  const eyebrowsAnalysis = analyzeEyebrows(features)
  const eyesAnalysis = analyzeEyes(features)
  const noseAnalysis = analyzeNose(features)
  const mouthAnalysis = analyzeMouth(features)
  const jawAnalysis = analyzeJaw(features)
  const earsAnalysis = analyzeEars(features)

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

  // Create Ngũ Quan analysis (Five Features traditional analysis)
  const nguQuan = {
    eyes: eyesAnalysis.description,
    eyebrows: eyebrowsAnalysis.description,
    nose: noseAnalysis.description,
    mouth: mouthAnalysis.description,
    ears: earsAnalysis.description,
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
    nguQuan,
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
