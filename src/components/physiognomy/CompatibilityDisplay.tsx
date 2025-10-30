'use client'

import { Card, CardBody, CardHeader, Progress, Chip } from '@nextui-org/react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { type CompatibilityResult } from '@/utils/compatibility'
import { Heart, CheckCircle, AlertCircle, Lightbulb, Sparkles } from 'lucide-react'

interface CompatibilityDisplayProps {
  result: CompatibilityResult
  image1Url: string
  image2Url: string
  person1Name?: string
  person2Name?: string
}

export default function CompatibilityDisplay({
  result,
  image1Url,
  image2Url,
  person1Name = 'Person 1',
  person2Name = 'Person 2',
}: CompatibilityDisplayProps) {
  // Prepare radar chart data (normalized to 100 for better visualization)
  const compatibilityData = [
    {
      category: 'Tam Đình',
      score: Math.round((result.categories.tamDinhRatio / 300) * 100),
      maxScore: 300,
      actualScore: result.categories.tamDinhRatio
    },
    {
      category: 'Ngũ Quan',
      score: Math.round((result.categories.nguQuanSimilarity / 400) * 100),
      maxScore: 400,
      actualScore: result.categories.nguQuanSimilarity
    },
    {
      category: 'Cấu Trúc',
      score: Math.round((result.categories.overallStructure / 150) * 100),
      maxScore: 150,
      actualScore: result.categories.overallStructure
    },
    {
      category: 'Âm-Dương',
      score: Math.round((result.categories.yinYangBalance / 150) * 100),
      maxScore: 150,
      actualScore: result.categories.yinYangBalance
    },
  ]

  // Get color based on 1000-point score
  const getScoreColor = (score: number): 'success' | 'warning' | 'danger' => {
    if (score >= 800) return 'success'
    if (score >= 600) return 'warning'
    return 'danger'
  }

  // Get color for category scores
  const getCategoryScoreColor = (score: number, maxScore: number): 'success' | 'warning' | 'danger' => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return 'success'
    if (percentage >= 60) return 'warning'
    return 'danger'
  }

  // Get compatibility level icon
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Rất cao':
        return '🌟'
      case 'Cao':
        return '💫'
      case 'Trung bình':
        return '✨'
      default:
        return '💭'
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-orange-500/20 border-2 border-pink-200">
        <CardBody className="gap-6">
          {/* Images */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-2">
                <img
                  src={image1Url}
                  alt={person1Name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm font-medium">{person1Name}</p>
            </div>

            <div className="flex-shrink-0">
              <Heart className="w-12 h-12 text-pink-500 fill-pink-500 animate-pulse" />
            </div>

            <div className="text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-2">
                <img
                  src={image2Url}
                  alt={person2Name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm font-medium">{person2Name}</p>
            </div>
          </div>

          {/* Overall Score */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-40 h-40 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 shadow-2xl mb-3">
              <div className="flex items-center justify-center w-36 h-36 rounded-full bg-white">
                <div className="text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 bg-clip-text text-transparent">
                    {Math.round(result.overallScore)}
                  </div>
                  <div className="text-xs text-default-500 font-semibold">/ 1000 điểm</div>
                </div>
              </div>
            </div>
            <div className="mb-3">
              <Chip
                color={getScoreColor(result.overallScore)}
                variant="shadow"
                size="lg"
                startContent={<Sparkles className="w-4 h-4" />}
                classNames={{
                  base: "px-6 py-3",
                  content: "text-base font-semibold"
                }}
              >
                {getLevelIcon(result.compatibilityLevel)} {result.compatibilityLevel}
              </Chip>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              Độ Tương Hợp Tướng Phu Thê
            </h3>
          </div>
        </CardBody>
      </Card>

      {/* Category Scores - New 1000-point system */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Phân Tích Chi Tiết (1000 điểm)</h3>
        </CardHeader>
        <CardBody className="gap-5">
          {/* Tam Dinh - 300 points */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold">
                Tam Đình (Ba Vùng Khuôn Mặt)
              </span>
              <span className="text-sm font-bold text-purple-600">
                {result.categories.tamDinhRatio}/300
              </span>
            </div>
            <Progress
              value={(result.categories.tamDinhRatio / 300) * 100}
              color={getCategoryScoreColor(result.categories.tamDinhRatio, 300)}
              className="max-w-full"
              size="md"
            />
            <p className="text-xs text-default-500 mt-1">
              Thượng-Trung-Hạ Đình: Vận mệnh qua 3 giai đoạn cuộc đời
            </p>
          </div>

          {/* Ngu Quan - 400 points */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold">
                Ngũ Quan (Năm Nét Chính)
              </span>
              <span className="text-sm font-bold text-pink-600">
                {result.categories.nguQuanSimilarity}/400
              </span>
            </div>
            <Progress
              value={(result.categories.nguQuanSimilarity / 400) * 100}
              color={getCategoryScoreColor(result.categories.nguQuanSimilarity, 400)}
              className="max-w-full"
              size="md"
            />
            <p className="text-xs text-default-500 mt-1">
              Mắt-Mày-Mũi-Miệng-Hàm: Tương đồng về các nét mặt chính
            </p>
          </div>

          {/* Overall Structure - 150 points */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold">
                Cấu Trúc Tổng Thể
              </span>
              <span className="text-sm font-bold text-orange-600">
                {result.categories.overallStructure}/150
              </span>
            </div>
            <Progress
              value={(result.categories.overallStructure / 150) * 100}
              color={getCategoryScoreColor(result.categories.overallStructure, 150)}
              className="max-w-full"
              size="md"
            />
            <p className="text-xs text-default-500 mt-1">
              Hình dạng và tỷ lệ khuôn mặt tổng thể
            </p>
          </div>

          {/* Yin-Yang Balance - 150 points */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold">
                Cân Bằng Âm-Dương
              </span>
              <span className="text-sm font-bold text-indigo-600">
                {result.categories.yinYangBalance}/150
              </span>
            </div>
            <Progress
              value={(result.categories.yinYangBalance / 150) * 100}
              color={getCategoryScoreColor(result.categories.yinYangBalance, 150)}
              className="max-w-full"
              size="md"
            />
            <p className="text-xs text-default-500 mt-1">
              Sự bổ sung và hài hòa giữa tính cách mạnh-mềm
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Biểu Đồ Tương Hợp</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={compatibilityData}>
              <PolarGrid stroke="#e4e4e7" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: '#71717a', fontSize: 13, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#71717a', fontSize: 11 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Radar
                name="Tương hợp"
                dataKey="score"
                stroke="#ec4899"
                fill="#ec4899"
                fillOpacity={0.6}
                strokeWidth={2}
              />
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload.length > 0) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                        <p className="font-semibold text-sm mb-1">{data.category}</p>
                        <p className="text-xs text-gray-600">
                          {data.actualScore}/{data.maxScore} điểm ({data.score}%)
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Analysis */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Phân Tích Tổng Quan</h3>
        </CardHeader>
        <CardBody className="gap-4">
          <div className="prose prose-sm max-w-none">
            <div className="text-default-700 whitespace-pre-line markdown-content">
              {result.analysis}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Strengths */}
      {result.details.strengths.length > 0 && (
        <Card className="border-success-200 bg-success-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <h3 className="text-lg font-semibold text-success-700">
                Điểm Mạnh
              </h3>
            </div>
          </CardHeader>
          <CardBody>
            <ul className="space-y-3">
              {result.details.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-success-800 markdown-content">
                    {strength}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* Challenges */}
      {result.details.challenges.length > 0 && (
        <Card className="border-warning-200 bg-warning-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              <h3 className="text-lg font-semibold text-warning-700">
                Thách Thức
              </h3>
            </div>
          </CardHeader>
          <CardBody>
            <ul className="space-y-3">
              {result.details.challenges.map((challenge, index) => (
                <li key={index} className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-warning-800 markdown-content">
                    {challenge}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* Advice */}
      {result.details.advice.length > 0 && (
        <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-primary">
                Lời Khuyên
              </h3>
            </div>
          </CardHeader>
          <CardBody>
            <ul className="space-y-3">
              {result.details.advice.map((tip, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-primary-800">
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* Footer Note */}
      <Card className="bg-gray-50 border border-gray-200">
        <CardBody>
          <p className="text-xs text-gray-600 text-center">
            ⚠️ Lưu ý: Kết quả phân tích chỉ mang tính tham khảo dựa trên nguyên tắc nhân tướng học truyền thống.
            Theo nguyên lý "Tướng do tâm sinh", tình yêu thật sự và sự nỗ lực có thể vượt qua mọi khác biệt.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
