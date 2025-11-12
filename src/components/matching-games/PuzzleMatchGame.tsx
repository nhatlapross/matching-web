"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Trophy, Timer } from 'lucide-react';
import { toast } from 'react-toastify';

interface PuzzlePiece {
  id: number;
  currentPosition: number;
  correctPosition: number;
  isEmpty: boolean;
}

interface PuzzleMatchGameProps {
  targetUser: {
    id: string;
    name: string;
    image?: string;
  };
  onComplete: () => void;
  onBack: () => void;
}

export default function PuzzleMatchGame({
  targetUser,
  onComplete,
  onBack
}: PuzzleMatchGameProps) {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Load and crop image
  useEffect(() => {
    const loadImage = async () => {
      if (!targetUser.image) {
        toast.error('No image available for this user');
        setIsLoading(false);
        return;
      }

      try {
        const croppedUrl = await cropImageToSquare(targetUser.image);
        setImageUrl(croppedUrl);
        initializePuzzle();
      } catch (error) {
        console.error('Error loading image:', error);
        toast.error('Failed to load image');
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [targetUser.image]);

  const cropImageToSquare = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }

        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;

        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        const croppedUrl = canvas.toDataURL('image/jpeg', 0.95);
        resolve(croppedUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  };

  const initializePuzzle = () => {
    const initialPieces: PuzzlePiece[] = Array.from({ length: 9 }, (_, i) => ({
      id: i,
      currentPosition: i,
      correctPosition: i,
      isEmpty: i === 8,
    }));

    const shuffled = shufflePuzzle(initialPieces);
    setPieces(shuffled);
    setMoves(0);
    setIsWon(false);
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
  };

  const shufflePuzzle = (initialPieces: PuzzlePiece[]): PuzzlePiece[] => {
    const pieces = [...initialPieces];

    for (let i = 0; i < 100; i++) {
      const emptyIndex = pieces.findIndex((p) => p.isEmpty);
      const validMoves = getValidMoves(emptyIndex);
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];

      [pieces[emptyIndex], pieces[randomMove]] = [pieces[randomMove], pieces[emptyIndex]];
      pieces[emptyIndex].currentPosition = emptyIndex;
      pieces[randomMove].currentPosition = randomMove;
    }

    return pieces;
  };

  const getValidMoves = (emptyIndex: number): number[] => {
    const row = Math.floor(emptyIndex / 3);
    const col = emptyIndex % 3;
    const moves: number[] = [];

    if (row > 0) moves.push(emptyIndex - 3);
    if (row < 2) moves.push(emptyIndex + 3);
    if (col > 0) moves.push(emptyIndex - 1);
    if (col < 2) moves.push(emptyIndex + 1);

    return moves;
  };

  const handlePieceClick = (clickedIndex: number) => {
    if (isWon) return;

    const emptyIndex = pieces.findIndex((p) => p.isEmpty);
    const validMoves = getValidMoves(emptyIndex);

    if (validMoves.includes(clickedIndex)) {
      const newPieces = [...pieces];

      [newPieces[emptyIndex], newPieces[clickedIndex]] = [
        newPieces[clickedIndex],
        newPieces[emptyIndex],
      ];
      newPieces[emptyIndex].currentPosition = emptyIndex;
      newPieces[clickedIndex].currentPosition = clickedIndex;

      setPieces(newPieces);
      setMoves(moves + 1);

      if (checkWin(newPieces)) {
        setIsWon(true);
        if (timerRef.current) clearInterval(timerRef.current);
        toast.success('🎉 Puzzle completed! Sending your like...');
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    }
  };

  const checkWin = (pieces: PuzzlePiece[]): boolean => {
    return pieces.every((piece) => piece.currentPosition === piece.correctPosition);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading puzzle...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Moves</p>
          <p className="text-2xl font-bold">{moves}</p>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">Time</p>
          </div>
          <p className="text-2xl font-bold">{formatTime(elapsedTime)}</p>
        </div>
        <div className={`p-4 rounded-lg ${isWon ? 'bg-green-100 dark:bg-green-950' : 'bg-muted'}`}>
          <div className="flex items-center gap-2">
            <Trophy className={`h-4 w-4 ${isWon ? 'text-green-600' : 'text-muted-foreground'}`} />
            <p className="text-sm text-muted-foreground">Status</p>
          </div>
          <p className="text-lg font-bold">{isWon ? '🎉 Won!' : 'Playing...'}</p>
        </div>
      </div>

      {/* Puzzle Grid */}
      {pieces.length > 0 && imageUrl && (
        <div
          className="grid grid-cols-3 gap-2 bg-gray-900 p-2 rounded-lg mx-auto w-full"
          style={{ maxWidth: '400px', aspectRatio: '1' }}
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
                ...(!piece.isEmpty && imageUrl
                  ? {
                      backgroundImage: `url(${imageUrl})`,
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
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>How to play:</strong> Click on tiles next to the empty space to move them. Arrange all pieces to complete the puzzle!
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isWon}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          variant="outline"
          onClick={initializePuzzle}
          disabled={isWon}
          className="flex-1"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
}
