'use client'

import { useState, useRef } from 'react'
import { Card, CardBody, CardHeader, Button, Divider } from '@nextui-org/react'
import { Upload, RotateCcw, Trophy, Timer } from 'lucide-react'
import { toast } from 'react-toastify'

interface PuzzlePiece {
  id: number // 0-8, với 8 là empty slot
  currentPosition: number
  correctPosition: number
  isEmpty: boolean
}

export default function PuzzleGamePage() {
  const [image, setImage] = useState<string | null>(null)
  const [pieces, setPieces] = useState<PuzzlePiece[]>([])
  const [moves, setMoves] = useState(0)
  const [isWon, setIsWon] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // Crop image to square (center crop)
  const cropImageToSquare = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Cannot get canvas context'))
          return
        }

        // Determine crop size (smallest dimension)
        const size = Math.min(img.width, img.height)
        canvas.width = size
        canvas.height = size

        // Calculate crop position (center)
        const sx = (img.width - size) / 2
        const sy = (img.height - size) / 2

        // Draw cropped image
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size)

        // Convert to data URL
        const croppedUrl = canvas.toDataURL('image/jpeg', 0.95)
        resolve(croppedUrl)
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageUrl
    })
  }

  // Initialize puzzle với ảnh
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File quá lớn. Vui lòng chọn ảnh < 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh')
      return
    }

    const url = URL.createObjectURL(file)

    try {
      // Crop to square
      const croppedUrl = await cropImageToSquare(url)
      setImage(croppedUrl)

      // Initialize puzzle
      setTimeout(() => {
        initializePuzzle()
        toast.success('✅ Đã tải ảnh! Bắt đầu chơi!')
      }, 100)
    } catch (error) {
      console.error('Error cropping image:', error)
      toast.error('Lỗi khi xử lý ảnh')
    }
  }

  // Khởi tạo puzzle
  const initializePuzzle = () => {
    console.log('🎮 Initializing puzzle...')

    // Tạo mảng 0-8
    const initialPieces: PuzzlePiece[] = Array.from({ length: 9 }, (_, i) => ({
      id: i,
      currentPosition: i,
      correctPosition: i,
      isEmpty: i === 8, // Ô cuối là empty
    }))

    console.log('Initial pieces:', initialPieces)

    // Shuffle
    const shuffled = shufflePuzzle(initialPieces)
    console.log('Shuffled pieces:', shuffled)

    setPieces(shuffled)
    setMoves(0)
    setIsWon(false)
    startTimeRef.current = Date.now()
    setElapsedTime(0)

    console.log('✅ Puzzle initialized with', shuffled.length, 'pieces')

    // Start timer
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }
    }, 1000)
  }

  // Shuffle puzzle (đảm bảo có thể giải được)
  const shufflePuzzle = (initialPieces: PuzzlePiece[]): PuzzlePiece[] => {
    const pieces = [...initialPieces]

    // Thực hiện 100 random moves hợp lệ
    for (let i = 0; i < 100; i++) {
      const emptyIndex = pieces.findIndex((p) => p.isEmpty)
      const validMoves = getValidMoves(emptyIndex)
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)]

      // Swap
      ;[pieces[emptyIndex], pieces[randomMove]] = [pieces[randomMove], pieces[emptyIndex]]
      pieces[emptyIndex].currentPosition = emptyIndex
      pieces[randomMove].currentPosition = randomMove
    }

    return pieces
  }

  // Lấy các nước đi hợp lệ từ vị trí empty
  const getValidMoves = (emptyIndex: number): number[] => {
    const row = Math.floor(emptyIndex / 3)
    const col = emptyIndex % 3
    const moves: number[] = []

    // Up
    if (row > 0) moves.push(emptyIndex - 3)
    // Down
    if (row < 2) moves.push(emptyIndex + 3)
    // Left
    if (col > 0) moves.push(emptyIndex - 1)
    // Right
    if (col < 2) moves.push(emptyIndex + 1)

    return moves
  }

  // Click vào một piece
  const handlePieceClick = (clickedIndex: number) => {
    if (isWon) return

    const emptyIndex = pieces.findIndex((p) => p.isEmpty)
    const validMoves = getValidMoves(emptyIndex)

    // Check nếu piece có thể di chuyển
    if (validMoves.includes(clickedIndex)) {
      const newPieces = [...pieces]

      // Swap
      ;[newPieces[emptyIndex], newPieces[clickedIndex]] = [
        newPieces[clickedIndex],
        newPieces[emptyIndex],
      ]
      newPieces[emptyIndex].currentPosition = emptyIndex
      newPieces[clickedIndex].currentPosition = clickedIndex

      setPieces(newPieces)
      setMoves(moves + 1)

      // Check win
      if (checkWin(newPieces)) {
        setIsWon(true)
        if (timerRef.current) clearInterval(timerRef.current)
        toast.success('🎉 Chúc mừng! Bạn đã hoàn thành!')
      }
    }
  }

  // Check win
  const checkWin = (pieces: PuzzlePiece[]): boolean => {
    return pieces.every((piece) => piece.currentPosition === piece.correctPosition)
  }

  // Reset game
  const handleReset = () => {
    if (image) {
      initializePuzzle()
      toast.info('🔄 Đã reset game!')
    }
  }

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧩 Slide Puzzle Game 3x3</h1>
        <p className="text-default-600">Upload ảnh và giải puzzle!</p>
      </div>

      {!image || pieces.length === 0 ? (
        // Upload screen
        <Card>
          <CardBody className="py-12">
            <div
              className="border-2 border-dashed border-default-300 rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-16 w-16 mx-auto mb-4 text-default-400" />
              <p className="text-lg font-medium mb-2">Click để chọn ảnh</p>
              <p className="text-sm text-default-400">
                Ảnh sẽ được chia thành 9 mảnh để chơi puzzle
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </CardBody>
        </Card>
      ) : (
        // Game screen
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardBody className="flex flex-row items-center gap-3">
                <div className="text-2xl">👣</div>
                <div>
                  <p className="text-sm text-default-500">Số bước</p>
                  <p className="text-xl font-bold">{moves}</p>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="flex flex-row items-center gap-3">
                <Timer className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm text-default-500">Thời gian</p>
                  <p className="text-xl font-bold">{formatTime(elapsedTime)}</p>
                </div>
              </CardBody>
            </Card>
            <Card className={isWon ? 'bg-success-50 border-2 border-success' : ''}>
              <CardBody className="flex flex-row items-center gap-3">
                <Trophy className={`h-6 w-6 ${isWon ? 'text-success' : 'text-default-300'}`} />
                <div>
                  <p className="text-sm text-default-500">Trạng thái</p>
                  <p className="text-lg font-bold">{isWon ? '🎉 Thắng!' : 'Chơi...'}</p>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Puzzle Grid */}
          <Card>
            <CardBody className="p-4">
              {pieces.length > 0 ? (
                <div
                  className="grid grid-cols-3 gap-2 bg-gray-900 p-2 rounded-lg mx-auto w-full"
                  style={{ maxWidth: '500px', aspectRatio: '1' }}
                >
                  {pieces.map((piece, index) => (
                    <div
                      key={`piece-${index}-${piece.id}`}
                      className={`relative w-full cursor-pointer transition-all duration-200 rounded ${
                        piece.isEmpty
                          ? 'bg-gray-800'
                          : 'hover:opacity-80 hover:scale-95'
                      }`}
                      style={{
                        aspectRatio: '1',
                        ...(!piece.isEmpty && image
                          ? {
                              backgroundImage: `url(${image})`,
                              backgroundSize: '300%',
                              backgroundPosition: `${(piece.id % 3) * 50}% ${
                                Math.floor(piece.id / 3) * 50
                              }%`,
                              backgroundRepeat: 'no-repeat',
                            }
                          : {}),
                      }}
                      onClick={() => handlePieceClick(index)}
                    >
                      {!piece.isEmpty && (
                        <div className="absolute inset-0 border-2 border-white/30 rounded" />
                      )}
                      {/* Debug number */}
                      <div className="absolute top-1 left-1 text-white text-xs bg-black/50 px-1 rounded">
                        {piece.id}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-default-500">Đang khởi tạo puzzle...</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              color="primary"
              startContent={<RotateCcw className="h-4 w-4" />}
              onPress={handleReset}
              className="flex-1"
            >
              Chơi lại
            </Button>
            <Button
              color="default"
              variant="flat"
              onPress={() => {
                setImage(null)
                setPieces([])
                setMoves(0)
                setIsWon(false)
                if (timerRef.current) clearInterval(timerRef.current)
              }}
              className="flex-1"
            >
              Chọn ảnh khác
            </Button>
          </div>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">📖 Cách chơi</h3>
            </CardHeader>
            <Divider />
            <CardBody className="text-sm space-y-2">
              <p>🎯 <strong>Mục tiêu:</strong> Sắp xếp lại các mảnh để hoàn thành ảnh</p>
              <p>🖱️ <strong>Di chuyển:</strong> Click vào mảnh cạnh ô trống để di chuyển</p>
              <p>💡 <strong>Tips:</strong> Giải từng hàng từ trên xuống dưới</p>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
