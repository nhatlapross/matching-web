"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X, Trophy } from 'lucide-react';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';

interface InterestsMatchGameProps {
  targetUser: {
    id: string;
    name: string;
    interests?: string[];
  };
  onComplete: () => void;
  onBack: () => void;
}

// Common interests pool for mixing
const COMMON_INTERESTS = [
  'Reading', 'Gaming', 'Cooking', 'Travel', 'Music',
  'Movies', 'Sports', 'Photography', 'Art', 'Dancing',
  'Hiking', 'Yoga', 'Swimming', 'Running', 'Cycling',
  'Painting', 'Writing', 'Singing', 'Guitar', 'Piano',
  'Coffee', 'Tea', 'Wine', 'Beer', 'Cocktails',
  'Cats', 'Dogs', 'Birds', 'Fish', 'Pets',
  'Technology', 'Science', 'History', 'Politics', 'Philosophy',
  'Fashion', 'Beauty', 'Fitness', 'Meditation', 'Gardening'
];

export default function InterestsMatchGame({
  targetUser,
  onComplete,
  onBack
}: InterestsMatchGameProps) {
  const [mixedInterests, setMixedInterests] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!targetUser.interests || targetUser.interests.length === 0) {
      toast.error('This user has no interests listed');
      return;
    }

    // Mix target user's interests with random ones
    const userInterests = targetUser.interests;
    const numToAdd = Math.max(8 - userInterests.length, 4); // At least 4 fake interests
    
    // Get random interests that are not in user's list
    const availableInterests = COMMON_INTERESTS.filter(
      interest => !userInterests.includes(interest)
    );
    
    const randomInterests = availableInterests
      .sort(() => Math.random() - 0.5)
      .slice(0, numToAdd);

    // Combine and shuffle
    const combined = [...userInterests, ...randomInterests]
      .sort(() => Math.random() - 0.5);

    setMixedInterests(combined);
    setTotalCount(userInterests.length);
  }, [targetUser.interests]);

  const toggleInterest = (interest: string) => {
    if (isSubmitted) return;

    const newSelected = new Set(selectedInterests);
    if (newSelected.has(interest)) {
      newSelected.delete(interest);
    } else {
      newSelected.add(interest);
    }
    setSelectedInterests(newSelected);
  };

  const handleSubmit = () => {
    if (selectedInterests.size === 0) {
      toast.error('Please select at least one interest');
      return;
    }

    const userInterests = new Set(targetUser.interests || []);
    let correct = 0;

    selectedInterests.forEach(interest => {
      if (userInterests.has(interest)) {
        correct++;
      }
    });

    const percentage = Math.round((correct / totalCount) * 100);
    setCorrectCount(correct);
    setScore(percentage);
    setIsSubmitted(true);

    if (percentage >= 50) {
      toast.success(`🎉 Great job! You got ${percentage}% correct!`);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      toast.error(`❌ Only ${percentage}% correct. You need 50% or more. Try again!`);
    }
  };

  const handleReset = () => {
    setSelectedInterests(new Set());
    setIsSubmitted(false);
    setScore(0);
    setCorrectCount(0);
    
    // Re-shuffle
    const userInterests = targetUser.interests || [];
    const numToAdd = Math.max(8 - userInterests.length, 4);
    
    const availableInterests = COMMON_INTERESTS.filter(
      interest => !userInterests.includes(interest)
    );
    
    const randomInterests = availableInterests
      .sort(() => Math.random() - 0.5)
      .slice(0, numToAdd);

    const combined = [...userInterests, ...randomInterests]
      .sort(() => Math.random() - 0.5);

    setMixedInterests(combined);
  };

  const getInterestStatus = (interest: string): 'correct' | 'wrong' | 'missed' | 'none' => {
    if (!isSubmitted) return 'none';

    const userInterests = new Set(targetUser.interests || []);
    const isUserInterest = userInterests.has(interest);
    const isSelected = selectedInterests.has(interest);

    if (isSelected && isUserInterest) return 'correct';
    if (isSelected && !isUserInterest) return 'wrong';
    if (!isSelected && isUserInterest) return 'missed';
    return 'none';
  };

  if (!targetUser.interests || targetUser.interests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">This user hasn't listed any interests yet.</p>
        <Button onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200 dark:border-pink-800">
        <h3 className="font-semibold text-pink-900 dark:text-pink-300 mb-2">
          🎯 Your Challenge
        </h3>
        <p className="text-sm text-pink-800 dark:text-pink-300">
          Select the interests that belong to <strong>{targetUser.name}</strong>. 
          Get <strong>50% or more correct</strong> to send your like!
        </p>
        <p className="text-xs text-pink-700 dark:text-pink-400 mt-2">
          💡 They have {totalCount} interests hidden among these options
        </p>
      </div>

      {/* Score Display (after submission) */}
      {isSubmitted && (
        <div className={cn(
          "p-4 rounded-lg border-2",
          score >= 50 
            ? "bg-green-50 dark:bg-green-950/20 border-green-500" 
            : "bg-red-50 dark:bg-red-950/20 border-red-500"
        )}>
          <div className="flex items-center gap-3">
            <Trophy className={cn(
              "h-8 w-8",
              score >= 50 ? "text-green-600" : "text-red-600"
            )} />
            <div>
              <p className="font-semibold text-lg">
                {score >= 50 ? '🎉 Success!' : '❌ Not quite...'}
              </p>
              <p className="text-sm">
                You got {correctCount} out of {totalCount} correct ({score}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interests Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {mixedInterests.map((interest) => {
          const status = getInterestStatus(interest);
          const isSelected = selectedInterests.has(interest);

          return (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              disabled={isSubmitted}
              className={cn(
                "p-4 rounded-lg border-2 transition-all text-left relative",
                !isSubmitted && !isSelected && "border-border hover:border-primary hover:bg-primary/5",
                !isSubmitted && isSelected && "border-primary bg-primary/10",
                status === 'correct' && "border-green-500 bg-green-50 dark:bg-green-950/20",
                status === 'wrong' && "border-red-500 bg-red-50 dark:bg-red-950/20",
                status === 'missed' && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
                status === 'none' && isSubmitted && "opacity-50",
                isSubmitted && "cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{interest}</span>
                {isSubmitted && (
                  <div>
                    {status === 'correct' && <Check className="h-5 w-5 text-green-600" />}
                    {status === 'wrong' && <X className="h-5 w-5 text-red-600" />}
                    {status === 'missed' && <span className="text-yellow-600 text-xs">Missed</span>}
                  </div>
                )}
                {!isSubmitted && isSelected && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Count */}
      {!isSubmitted && (
        <div className="text-center text-sm text-muted-foreground">
          Selected: {selectedInterests.size} / {mixedInterests.length}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSubmitted && score >= 50}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        {!isSubmitted ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedInterests.size === 0}
            className="flex-1"
          >
            Submit Answer
          </Button>
        ) : score < 50 ? (
          <Button
            onClick={handleReset}
            className="flex-1"
          >
            Try Again
          </Button>
        ) : null}
      </div>
    </div>
  );
}
