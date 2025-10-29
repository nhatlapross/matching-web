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
  Legend,
} from 'recharts'
import { CompatibilityResult } from '@/utils/compatibility'
import { Heart, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react'

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
  // Prepare radar chart data
  const compatibilityData = [
    {
      category: 'Physical',
      score: Math.round(result.categories.physical),
    },
    {
      category: 'Personality',
      score: Math.round(result.categories.personality),
    },
    {
      category: 'Fortune',
      score: Math.round(result.categories.fortune),
    },
    {
      category: 'Balance',
      score: Math.round(result.categories.balance),
    },
  ]

  // Get color based on score
  const getScoreColor = (score: number): 'success' | 'warning' | 'danger' => {
    if (score >= 70) return 'success'
    if (score >= 50) return 'warning'
    return 'danger'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent'
    if (score >= 65) return 'Good'
    if (score >= 50) return 'Fair'
    return 'Needs Work'
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-2 border-pink-200">
        <CardBody className="gap-6">
          {/* Images */}
          <div className="flex items-center justify-center gap-6">
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
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-white shadow-lg mb-3">
              <div className="text-center">
                <div className="text-4xl font-bold text-pink-500">
                  {Math.round(result.overallScore)}
                </div>
                <div className="text-xs text-default-500">out of 100</div>
              </div>
            </div>
            <div className="mb-2">
              <Chip
                color={getScoreColor(result.overallScore)}
                variant="flat"
                size="lg"
              >
                {getScoreLabel(result.overallScore)}
              </Chip>
            </div>
            <h3 className="text-xl font-semibold">Compatibility Score</h3>
          </div>
        </CardBody>
      </Card>

      {/* Category Scores */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Compatibility Breakdown</h3>
        </CardHeader>
        <CardBody className="gap-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Physical Compatibility</span>
              <span className="text-sm text-default-500">
                {Math.round(result.categories.physical)}%
              </span>
            </div>
            <Progress
              value={result.categories.physical}
              color={getScoreColor(result.categories.physical)}
              className="max-w-full"
            />
            <p className="text-xs text-default-500 mt-1">
              Hài hòa về ngoại hình và cảm giác thẩm mỹ
            </p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Personality Compatibility</span>
              <span className="text-sm text-default-500">
                {Math.round(result.categories.personality)}%
              </span>
            </div>
            <Progress
              value={result.categories.personality}
              color={getScoreColor(result.categories.personality)}
              className="max-w-full"
            />
            <p className="text-xs text-default-500 mt-1">
              Tương hợp về tính cách và cách sống
            </p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Fortune Compatibility</span>
              <span className="text-sm text-default-500">
                {Math.round(result.categories.fortune)}%
              </span>
            </div>
            <Progress
              value={result.categories.fortune}
              color={getScoreColor(result.categories.fortune)}
              className="max-w-full"
            />
            <p className="text-xs text-default-500 mt-1">
              Tương hợp về vận mệnh và mục tiêu cuộc sống
            </p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Balance & Harmony</span>
              <span className="text-sm text-default-500">
                {Math.round(result.categories.balance)}%
              </span>
            </div>
            <Progress
              value={result.categories.balance}
              color={getScoreColor(result.categories.balance)}
              className="max-w-full"
            />
            <p className="text-xs text-default-500 mt-1">
              Sự cân bằng và bổ sung cho nhau
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Compatibility Radar</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={compatibilityData}>
              <PolarGrid stroke="#e4e4e7" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: '#71717a', fontSize: 12 }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#71717a' }} />
              <Radar
                name="Compatibility"
                dataKey="score"
                stroke="#ec4899"
                fill="#ec4899"
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

      {/* Analysis */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Detailed Analysis</h3>
        </CardHeader>
        <CardBody className="gap-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-default-700 whitespace-pre-line">
              {result.analysis}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Strengths */}
      {result.details.strengths.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <h3 className="text-lg font-semibold">Strengths</h3>
            </div>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2">
              {result.details.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-default-700">{strength}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* Challenges */}
      {result.details.challenges.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              <h3 className="text-lg font-semibold">Challenges</h3>
            </div>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2">
              {result.details.challenges.map((challenge, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-default-700">{challenge}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* Advice */}
      {result.details.advice.length > 0 && (
        <Card className="bg-primary-50 border border-primary-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-primary">Advice</h3>
            </div>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2">
              {result.details.advice.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-primary-700">{tip}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
