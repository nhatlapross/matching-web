'use client'

import { useState, useRef } from 'react'
import { Card, CardBody, Button, Tabs, Tab } from '@nextui-org/react'
import { Sparkles, Users, User as UserIcon } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import FaceAnalyzer, { type FaceAnalyzerHandle } from '@/components/physiognomy/FaceAnalyzer'
import ResultsDisplay from '@/components/physiognomy/ResultsDisplay'
import CompatibilityDisplay from '@/components/physiognomy/CompatibilityDisplay'
import { type FaceFeatures } from '@/utils/faceAnalysis'
import { type PhysiognomyTraits } from '@/utils/physiognomy'
import { calculateCompatibility, type CompatibilityResult } from '@/utils/compatibility'

interface AnalysisData {
  features: FaceFeatures
  traits: PhysiognomyTraits
  imageUrl: string
}

type Mode = 'single' | 'compatibility'

function PhysiognomyPage() {
  const [mode, setMode] = useState<Mode>('single')
  const [person1Data, setPerson1Data] = useState<AnalysisData | null>(null)
  const [person2Data, setPerson2Data] = useState<AnalysisData | null>(null)
  const [compatibilityResult, setCompatibilityResult] =
    useState<CompatibilityResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [person1ImageReady, setPerson1ImageReady] = useState(false)
  const [person2ImageReady, setPerson2ImageReady] = useState(false)

  // Refs for FaceAnalyzer components in compatibility mode
  const person1AnalyzerRef = useRef<FaceAnalyzerHandle>(null)
  const person2AnalyzerRef = useRef<FaceAnalyzerHandle>(null)

  const handlePerson1Analysis = (
    features: FaceFeatures,
    traits: PhysiognomyTraits,
    imageUrl: string
  ) => {
    setPerson1Data({ features, traits, imageUrl })
    // Don't auto-calculate compatibility, wait for user to click button
  }

  const handlePerson2Analysis = (
    features: FaceFeatures,
    traits: PhysiognomyTraits,
    imageUrl: string
  ) => {
    setPerson2Data({ features, traits, imageUrl })
    // Don't auto-calculate compatibility, wait for user to click button
  }

  const handleCalculateCompatibility = async () => {
    // Trigger analysis on both faces SEQUENTIALLY to avoid MediaPipe WASM conflicts
    if (person1AnalyzerRef.current && person2AnalyzerRef.current) {
      setIsAnalyzing(true)
      try {
        // Analyze faces one by one (NOT in parallel)
        await person1AnalyzerRef.current.analyze()
        await person2AnalyzerRef.current.analyze()

        // Wait for state to update (analysis results should be in person1Data and person2Data)
        // Add a small delay to ensure state updates are processed
        await new Promise(resolve => setTimeout(resolve, 500))

        // Check if both analyses completed
        if (person1Data && person2Data) {
          const result = calculateCompatibility(
            person1Data.features,
            person1Data.traits,
            person2Data.features,
            person2Data.traits
          )
          setCompatibilityResult(result)
        }
      } catch (error) {
        console.error('Error during compatibility analysis:', error)
      } finally {
        setIsAnalyzing(false)
      }
    }
  }

  const handleReset = () => {
    setPerson1Data(null)
    setPerson2Data(null)
    setCompatibilityResult(null)
    setIsAnalyzing(false)
    setPerson1ImageReady(false)
    setPerson2ImageReady(false)
  }

  const handleModeChange = (key: string | number) => {
    setMode(key as Mode)
    handleReset()
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10">
        <CardBody className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="w-10 h-10 text-purple-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              Nhân Tướng Học AI
            </h1>
            <Sparkles className="w-10 h-10 text-orange-500" />
          </div>
          <p className="text-default-600 max-w-2xl mx-auto">
            Khám phá bí mật khuôn mặt của bạn với công nghệ AI tiên tiến. Phân tích
            đặc điểm khuôn mặt theo nguyên lý nhân tướng học cổ truyền kết hợp với
            MediaPipe Face Mesh.
          </p>
        </CardBody>
      </Card>

      {/* Mode Selection */}
      <Card>
        <CardBody>
          <Tabs
            selectedKey={mode}
            onSelectionChange={handleModeChange}
            variant="bordered"
            color="primary"
            classNames={{
              tabList: 'w-full',
              tab: 'h-12',
            }}
          >
            <Tab
              key="single"
              title={
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  <span>Single Analysis</span>
                </div>
              }
            />
            <Tab
              key="compatibility"
              title={
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Compatibility Analysis</span>
                </div>
              }
            />
          </Tabs>
        </CardBody>
      </Card>

      {/* Content based on mode */}
      {mode === 'single' ? (
        <>
          {/* Single Analysis Mode */}
          {!person1Data ? (
            <div className="max-w-2xl mx-auto">
              <FaceAnalyzer
                onAnalysisComplete={handlePerson1Analysis}
                title="Upload Your Photo"
              />
            </div>
          ) : (
            <>
              <ResultsDisplay
                features={person1Data.features}
                traits={person1Data.traits}
                imageUrl={person1Data.imageUrl}
                personName="You"
              />
              <div className="flex justify-center">
                <Button
                  size="lg"
                  color="primary"
                  variant="bordered"
                  onPress={handleReset}
                >
                  Analyze Another Face
                </Button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {/* Compatibility Analysis Mode */}
          {!compatibilityResult ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FaceAnalyzer
                  ref={person1AnalyzerRef}
                  onAnalysisComplete={handlePerson1Analysis}
                  title="First Person"
                  personNumber={1}
                  compatibilityMode={true}
                  onImageSelected={(url) => setPerson1ImageReady(true)}
                />
                <FaceAnalyzer
                  ref={person2AnalyzerRef}
                  onAnalysisComplete={handlePerson2Analysis}
                  title="Second Person"
                  personNumber={2}
                  compatibilityMode={true}
                  onImageSelected={(url) => setPerson2ImageReady(true)}
                />
              </div>

              {/* Show compatibility button when both images are uploaded */}
              {person1ImageReady && person2ImageReady && (
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    color="secondary"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg"
                    onPress={handleCalculateCompatibility}
                    isLoading={isAnalyzing}
                    startContent={
                      !isAnalyzing && <Sparkles className="w-5 h-5" />
                    }
                  >
                    {isAnalyzing ? 'Đang phân tích...' : '✨ Kiểm Tra Độ Tương Hợp'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <CompatibilityDisplay
                result={compatibilityResult}
                image1Url={person1Data!.imageUrl}
                image2Url={person2Data!.imageUrl}
                person1Name="Person 1"
                person2Name="Person 2"
              />

              <div className="flex justify-center">
                <Button
                  size="lg"
                  color="primary"
                  variant="bordered"
                  onPress={handleReset}
                >
                  Analyze New Pair
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border border-blue-200">
        <CardBody>
          <h3 className="font-semibold mb-2 text-blue-900">
            About Face Reading (Nhân Tướng Học)
          </h3>
          <p className="text-sm text-blue-800 mb-3">
            Nhân tướng học là nghệ thuật đọc và phân tích khuôn mặt con người để
            hiểu về tính cách, vận mệnh và khả năng của họ. Công cụ này sử dụng AI
            để phân tích các đặc điểm khuôn mặt theo nguyên lý cổ truyền:
          </p>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>
              <strong>Trán (Forehead):</strong> Phản ánh trí tuệ, sự nghiệp và vận
              mệnh đầu đời
            </li>
            <li>
              <strong>Mắt (Eyes):</strong> Thể hiện tính cách, cảm xúc và mối quan
              hệ
            </li>
            <li>
              <strong>Mũi (Nose):</strong> Tượng trưng cho tài lộc và quyết tâm
            </li>
            <li>
              <strong>Miệng (Mouth):</strong> Liên quan đến giao tiếp và mối quan hệ
            </li>
            <li>
              <strong>Hàm (Jaw):</strong> Biểu thị ý chí và sức khỏe
            </li>
          </ul>
          <p className="text-xs text-blue-600 mt-3">
            ⚠️ Lưu ý: Kết quả phân tích chỉ mang tính tham khảo và giải trí, không
            nên dùng để đưa ra quyết định quan trọng trong cuộc sống.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}

// Wrap with ErrorBoundary
function PhysiognomyPageWithBoundary() {
  return (
    <ErrorBoundary>
      <PhysiognomyPage />
    </ErrorBoundary>
  )
}

export default PhysiognomyPageWithBoundary
