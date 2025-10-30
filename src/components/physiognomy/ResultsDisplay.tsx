'use client'

import { Card, CardBody, CardHeader, Progress, Chip } from '@nextui-org/react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { type FaceFeatures } from '@/utils/faceAnalysis'
import { type PhysiognomyTraits } from '@/utils/physiognomy'
import { User, Brain, Heart, Sparkles, TrendingUp } from 'lucide-react'

interface ResultsDisplayProps {
  features: FaceFeatures
  traits: PhysiognomyTraits
  imageUrl: string
  personName?: string
}

export default function ResultsDisplay({
  features,
  traits,
  imageUrl,
  personName = 'Person',
}: ResultsDisplayProps) {
  // Prepare personality data for radar chart
  const personalityData = Object.entries(traits.personality).map(([key, value]) => ({
    trait: key.charAt(0).toUpperCase() + key.slice(1),
    value: Math.round(value),
  }))

  // Prepare fortune data for bar chart
  const fortuneData = Object.entries(traits.fortune).map(([key, value]) => ({
    category: key.charAt(0).toUpperCase() + key.slice(1),
    score: Math.round(value),
  }))

  // Get face shape color
  const faceShapeColors: Record<FaceFeatures['faceShape'], string> = {
    oval: 'primary',
    round: 'secondary',
    square: 'success',
    heart: 'warning',
    oblong: 'danger',
    diamond: 'default',
  }

  return (
    <div className="space-y-6 w-full">
      {/* Face Landmarks Card - Large Display */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Face Landmarks Analysis
          </h3>
        </CardHeader>
        <CardBody>
          <div className="flex justify-center">
            <div className="relative max-w-2xl w-full">
              <img
                src={imageUrl}
                alt={`${personName} - Face Landmarks`}
                className="w-full h-auto rounded-lg shadow-lg border-2 border-purple-200"
              />
              <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded-full text-xs">
                468-point MediaPipe Face Mesh (3D)
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span>Jaw (Hàm)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>Eyebrows (Lông mày)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span>Nose (Mũi)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
              <span>Eyes (Mắt)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-pink-500"></div>
              <span>Mouth (Miệng)</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Header Card */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10">
        <CardBody className="gap-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Summary */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">{personName}</h2>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
                <Chip
                  color={faceShapeColors[features.faceShape] as any}
                  variant="flat"
                  startContent={<User className="w-4 h-4" />}
                >
                  {features.faceShape.charAt(0).toUpperCase() +
                    features.faceShape.slice(1)}{' '}
                  Face
                </Chip>
                <Chip color="success" variant="flat">
                  {Math.round(traits.overallScore)} / 100
                </Chip>
              </div>
              <p className="text-sm text-default-600">
                {traits.analysis.overall.split('\n\n')[0]}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Scores Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-warning" />
            <h3 className="text-lg font-semibold">Overall Scores</h3>
          </div>
        </CardHeader>
        <CardBody className="gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Facial Harmony</span>
                <span className="text-sm text-default-500">
                  {Math.round(features.facialHarmony)}%
                </span>
              </div>
              <Progress
                value={features.facialHarmony}
                color="primary"
                className="max-w-full"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Facial Symmetry</span>
                <span className="text-sm text-default-500">
                  {Math.round(features.facialSymmetry)}%
                </span>
              </div>
              <Progress
                value={features.facialSymmetry}
                color="secondary"
                className="max-w-full"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Golden Ratio</span>
                <span className="text-sm text-default-500">
                  {Math.round(features.goldenRatioScore)}%
                </span>
              </div>
              <Progress
                value={features.goldenRatioScore}
                color="success"
                className="max-w-full"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tam Đình (Three Face Regions) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Tam Đình - Ba Vùng Khuôn Mặt</h3>
          </div>
        </CardHeader>
        <CardBody className="gap-4">
          <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg mb-4">
            <p className="text-sm text-purple-900 dark:text-purple-100 font-medium mb-2">
              {features.tamDinh.interpretation}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-700 dark:text-purple-300">
                Điểm cân bằng:
              </span>
              <Progress
                value={features.tamDinh.balance}
                color="secondary"
                className="flex-1"
                size="sm"
              />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                {Math.round(features.tamDinh.balance)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Thượng Đình */}
            <div className="border-2 border-primary rounded-lg p-4">
              <h4 className="font-semibold text-primary mb-2">Thượng Đình</h4>
              <p className="text-xs text-default-600 mb-3">
                Trán • Tuổi trẻ (15-30)
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tỷ lệ:</span>
                  <span className="font-medium">
                    {(features.tamDinh.thuongDinhRatio * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={features.tamDinh.thuongDinhRatio * 100}
                  color="primary"
                  className="max-w-full"
                  size="sm"
                />
                <p className="text-xs text-default-500 mt-2">
                  Thể hiện trí tuệ, vận may thời trẻ và tiềm năng lãnh đạo
                </p>
              </div>
            </div>

            {/* Trung Đình */}
            <div className="border-2 border-secondary rounded-lg p-4">
              <h4 className="font-semibold text-secondary mb-2">Trung Đình</h4>
              <p className="text-xs text-default-600 mb-3">
                Mắt-Mũi • Trung niên (31-50)
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tỷ lệ:</span>
                  <span className="font-medium">
                    {(features.tamDinh.trungDinhRatio * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={features.tamDinh.trungDinhRatio * 100}
                  color="secondary"
                  className="max-w-full"
                  size="sm"
                />
                <p className="text-xs text-default-500 mt-2">
                  Thể hiện ý chí, sự nghiệp và phát triển trung niên
                </p>
              </div>
            </div>

            {/* Hạ Đình */}
            <div className="border-2 border-success rounded-lg p-4">
              <h4 className="font-semibold text-success mb-2">Hạ Đình</h4>
              <p className="text-xs text-default-600 mb-3">
                Miệng-Hàm • Tuổi già (51+)
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tỷ lệ:</span>
                  <span className="font-medium">
                    {(features.tamDinh.haDinhRatio * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={features.tamDinh.haDinhRatio * 100}
                  color="success"
                  className="max-w-full"
                  size="sm"
                />
                <p className="text-xs text-default-500 mt-2">
                  Thể hiện các mối quan hệ, sức khỏe và hậu vận
                </p>
              </div>
            </div>
          </div>

          <div className="bg-default-100 dark:bg-default-50/5 rounded-lg p-3 text-xs text-default-600">
            <p className="font-medium mb-1">💡 Giải thích Tam Đình:</p>
            <p>
              Tam Đình (三停) là nguyên tắc chia khuôn mặt thành ba vùng theo chiều dọc,
              mỗi vùng thể hiện một giai đoạn cuộc đời. Tỷ lệ lý tưởng là 1:1:1 (33.3% mỗi vùng),
              cho thấy vận mệnh hài hòa và phát triển đều qua các giai đoạn.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Ngũ Quan (Five Features) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-500" />
            <h3 className="text-lg font-semibold">Ngũ Quan - Năm Quan Trọng</h3>
          </div>
        </CardHeader>
        <CardBody className="gap-4">
          <div className="bg-cyan-50 dark:bg-cyan-950/20 p-3 rounded-lg text-xs">
            <p className="font-medium mb-1">📖 Ngũ Quan là gì?</p>
            <p className="text-default-600">
              Ngũ Quan (五官) là năm bộ phận quan trọng nhất trên khuôn mặt theo tướng học:
              Mắt (thần khí), Lông mày (quan hệ), Mũi (tài lộc), Miệng (giao tiếp), và Tai (tuổi thọ).
              Mỗi quan đại diện cho một khía cạnh khác nhau của cuộc đời và tính cách.
            </p>
          </div>

          <div className="space-y-4">
            {/* Mắt - Giám Sát Quan */}
            <div className="border-l-4 border-cyan-500 pl-4">
              <h4 className="font-semibold text-cyan-700 dark:text-cyan-300 mb-1 flex items-center gap-2">
                👁️ Mắt (Giám Sát Quan)
                <span className="text-xs font-normal text-default-500">Thần khí & Tính cách</span>
              </h4>
              <p className="text-sm text-default-700">{traits.nguQuan.eyes}</p>
            </div>

            {/* Lông Mày - Bảo Thọ Quan */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-2">
                🦋 Lông Mày (Bảo Thọ Quan)
                <span className="text-xs font-normal text-default-500">Quan hệ & Tính khí</span>
              </h4>
              <p className="text-sm text-default-700">{traits.nguQuan.eyebrows}</p>
            </div>

            {/* Mũi - Thẩm Biện Quan */}
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1 flex items-center gap-2">
                👃 Mũi (Thẩm Biện Quan)
                <span className="text-xs font-normal text-default-500">Tài lộc & Quyết tâm</span>
              </h4>
              <p className="text-sm text-default-700">{traits.nguQuan.nose}</p>
            </div>

            {/* Miệng - Xuất Nạp Quan */}
            <div className="border-l-4 border-pink-500 pl-4">
              <h4 className="font-semibold text-pink-700 dark:text-pink-300 mb-1 flex items-center gap-2">
                💋 Miệng (Xuất Nạp Quan)
                <span className="text-xs font-normal text-default-500">Giao tiếp & Quan hệ</span>
              </h4>
              <p className="text-sm text-default-700">{traits.nguQuan.mouth}</p>
            </div>

            {/* Tai - Thái Thính Quan */}
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-green-700 dark:text-green-300 mb-1 flex items-center gap-2">
                👂 Tai (Thái Thính Quan)
                <span className="text-xs font-normal text-default-500">Tuổi thọ & Vận sớm</span>
              </h4>
              <p className="text-sm text-default-700">{traits.nguQuan.ears}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Personality Traits Radar Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Personality Traits</h3>
          </div>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={personalityData}>
              <PolarGrid stroke="#e4e4e7" />
              <PolarAngleAxis
                dataKey="trait"
                tick={{ fill: '#71717a', fontSize: 12 }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#71717a' }} />
              <Radar
                name="Score"
                dataKey="value"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e4e4e7',
                  borderRadius: '8px',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Fortune Analysis Bar Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <h3 className="text-lg font-semibold">Fortune Analysis</h3>
          </div>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fortuneData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="category"
                tick={{ fill: '#71717a', fontSize: 12 }}
              />
              <YAxis domain={[0, 100]} tick={{ fill: '#71717a' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e4e4e7',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="score" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-danger" />
            <h3 className="text-lg font-semibold">Detailed Analysis</h3>
          </div>
        </CardHeader>
        <CardBody className="gap-4">
          {/* Forehead */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-primary">
              Trán (Forehead) - Sự nghiệp & Trí tuệ
            </h4>
            <p className="text-sm text-default-600">{traits.analysis.forehead}</p>
          </div>

          {/* Eyes */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-secondary">
              Mắt (Eyes) - Tính cách & Cảm xúc
            </h4>
            <p className="text-sm text-default-600">{traits.analysis.eyes}</p>
          </div>

          {/* Nose */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-success">
              Mũi (Nose) - Tài lộc & Quyết tâm
            </h4>
            <p className="text-sm text-default-600">{traits.analysis.nose}</p>
          </div>

          {/* Mouth */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-warning">
              Miệng (Mouth) - Giao tiếp & Quan hệ
            </h4>
            <p className="text-sm text-default-600">{traits.analysis.mouth}</p>
          </div>

          {/* Jaw */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-danger">
              Hàm (Jaw) - Ý chí & Sức khỏe
            </h4>
            <p className="text-sm text-default-600">{traits.analysis.jaw}</p>
          </div>

          {/* Overall */}
          <div className="mt-4 p-4 bg-default-100 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Tổng quan</h4>
            <p className="text-sm text-default-700 whitespace-pre-line">
              {traits.analysis.overall}
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
