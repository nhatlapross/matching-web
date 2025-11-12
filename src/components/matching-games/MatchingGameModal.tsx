"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Puzzle, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import PuzzleMatchGame from './PuzzleMatchGame';
import InterestsMatchGame from './InterestsMatchGame';

interface MatchingGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: string;
    name: string;
    image?: string;
    interests?: string[];
  };
  onSuccess: () => void;
}

type GameType = 'select' | 'puzzle' | 'interests';

export default function MatchingGameModal({
  isOpen,
  onClose,
  targetUser,
  onSuccess
}: MatchingGameModalProps) {
  const [gameType, setGameType] = useState<GameType>('select');

  const handleGameComplete = () => {
    onSuccess();
    onClose();
  };

  const handleBack = () => {
    setGameType('select');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999999] bg-black/80 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999
      }}
    >
      <div 
        className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold">
              {gameType === 'select' && `Show interest in ${targetUser.name}`}
              {gameType === 'puzzle' && '🧩 Puzzle Challenge'}
              {gameType === 'interests' && '💝 Interests Challenge'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {gameType === 'select' && 'Choose a game to show you really care'}
              {gameType === 'puzzle' && 'Complete the puzzle to send your like'}
              {gameType === 'interests' && 'Guess their interests correctly'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {gameType === 'select' && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground mb-6">
                To show genuine interest, complete one of these challenges:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Puzzle Game */}
                <button
                  onClick={() => setGameType('puzzle')}
                  className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all p-6 text-left bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Puzzle className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Puzzle Challenge</h3>
                      <p className="text-sm text-muted-foreground">
                        Solve a 3x3 sliding puzzle using their photo
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ⏱️ Complete within time limit
                    </div>
                  </div>
                </button>

                {/* Interests Game */}
                <button
                  onClick={() => setGameType('interests')}
                  className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all p-6 text-left bg-gradient-to-br from-pink-50 to-red-50 dark:from-pink-950/20 dark:to-red-950/20"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Heart className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Interests Challenge</h3>
                      <p className="text-sm text-muted-foreground">
                        Guess their interests from a mixed list
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      🎯 Get 50%+ correct to win
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  💡 <strong>Why games?</strong> This ensures genuine interest and makes matching more fun and meaningful!
                </p>
              </div>
            </div>
          )}

          {gameType === 'puzzle' && (
            <PuzzleMatchGame
              targetUser={targetUser}
              onComplete={handleGameComplete}
              onBack={handleBack}
            />
          )}

          {gameType === 'interests' && (
            <InterestsMatchGame
              targetUser={targetUser}
              onComplete={handleGameComplete}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}
