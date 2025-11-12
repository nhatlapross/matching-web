"use client";

import React, { useState, useCallback, useEffect } from "react";
import SwipeCard from "./SwipeCard";
import { Button } from "@/components/ui/button";
import { Heart, X, RotateCcw, Info } from "lucide-react";
import type { Member } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { MatchingGameModal } from "@/components/matching-games";
import { useBlockchainMatch } from "@/hooks/useBlockchainMatch";

type Props = {
  initialMembers: (Member & {
    user?: {
      profileObjectId: string | null;
      walletAddress: string | null;
    };
  })[];
  avatarUrls: Record<string, string | null>;
  onSwipeAction: (memberId: string, direction: "left" | "right") => Promise<any>;
  currentUserId?: string;
  myProfileObjectId?: string | null;
};

export default function SwipeContainer({
  initialMembers,
  avatarUrls,
  onSwipeAction,
  currentUserId,
  myProfileObjectId,
}: Props) {
  const router = useRouter();
  const { createMatchOnChain, isCreatingMatch } = useBlockchainMatch();
  const [members, setMembers] = useState(initialMembers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [pendingSwipeMember, setPendingSwipeMember] = useState<typeof currentMember | null>(null);

  const currentMember = members[currentIndex];
  const hasMore = currentIndex < members.length - 1;

  const handleSwipe = useCallback(
    async (direction: "left" | "right") => {
      if (!currentMember || isProcessing) return;

      // ✅ If swipe right, show game modal instead of direct like
      if (direction === "right") {
        setPendingSwipeMember(currentMember);
        setShowGameModal(true);
        return;
      }

      // Swipe left - process normally
      setIsProcessing(true);

      try {
        await onSwipeAction(currentMember.userId, direction);
        setCurrentIndex((prev) => prev + 1);
      } catch (error) {
        console.error("Swipe error:", error);
        toast.error("Failed to process swipe");
      } finally {
        setIsProcessing(false);
      }
    },
    [currentMember, isProcessing, onSwipeAction]
  );

  // Handle game completion - send the like
  const handleGameSuccess = useCallback(async () => {
    if (!pendingSwipeMember) return;

    console.log('[SwipeContainer] Game completed for:', pendingSwipeMember.userId);
    setIsProcessing(true);

    try {
      const result = await onSwipeAction(pendingSwipeMember.userId, "right");
      console.log('[SwipeContainer] onSwipeAction result:', result);

      // Show feedback
      if (result?.isMatch) {
        console.log('[SwipeContainer] 🎉 Mutual match detected!');
        toast.success(`🎉 It's a match with ${pendingSwipeMember.name}!`, {
          position: "top-center",
        });

        // ✅ Create on-chain match if both users have blockchain profiles
        const targetWalletAddress = result.targetUser?.walletAddress;
        const targetProfileObjectId = result.targetUser?.profileObjectId;

        console.log('[SwipeContainer] Blockchain match check:', {
          myProfileObjectId,
          targetWalletAddress,
          targetProfileObjectId,
          hasAllData: !!(myProfileObjectId && targetWalletAddress && targetProfileObjectId)
        });

        if (myProfileObjectId && targetWalletAddress && targetProfileObjectId) {
          console.log('[SwipeContainer] ✅ Creating on-chain match...');

          // Create blockchain match in background (don't block UI)
          createMatchOnChain({
            targetUserAddress: targetWalletAddress,
            myProfileObjectId: myProfileObjectId,
            compatibilityScore: 95
          }).then((success) => {
            if (success) {
              console.log('[SwipeContainer] ✅ On-chain match created successfully!');
              toast.success('✨ Match recorded on blockchain!');
            } else {
              console.log('[SwipeContainer] ❌ On-chain match creation returned false');
            }
          }).catch((error) => {
            console.error('[SwipeContainer] ❌ Failed to create on-chain match:', error);
            // Don't show error toast - match is already created in database
          });
        } else {
          console.log('[SwipeContainer] ⚠️ Skipping on-chain match - missing blockchain data');
        }
      } else {
        console.log('[SwipeContainer] Not a mutual match, just a like');
        toast.success(`Game completed! Like sent to ${pendingSwipeMember.name}!`);
      }

      // Move to next card
      setCurrentIndex((prev) => prev + 1);
      setPendingSwipeMember(null);
    } catch (error) {
      console.error("[SwipeContainer] ❌ Swipe error:", error);
      toast.error("Failed to send like");
    } finally {
      setIsProcessing(false);
    }
  }, [pendingSwipeMember, onSwipeAction, myProfileObjectId, createMatchOnChain]);

  const handleUndo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      toast.info("Undo! Go back one card");
    }
  }, [currentIndex]);

  const handleRefresh = useCallback(() => {
    router.refresh();
    toast.success("Refreshed with new random matches!");
  }, [router]);

  const handleViewProfile = useCallback(() => {
    if (currentMember) {
      router.push(`/members/${currentMember.userId}`);
    }
  }, [currentMember, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProcessing) return;

      switch (e.key) {
        case "ArrowLeft":
          handleSwipe("left");
          break;
        case "ArrowRight":
          handleSwipe("right");
          break;
        case "ArrowUp":
          handleViewProfile();
          break;
        case "Backspace":
          if (e.ctrlKey || e.metaKey) {
            handleUndo();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSwipe, handleViewProfile, handleUndo, isProcessing]);

  if (!currentMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-6">
        <div className="text-center space-y-3">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold">No More Profiles</h2>
          <p className="text-muted-foreground">
            You've seen all available matches! Come back later for more.
          </p>
        </div>
        
        <Button onClick={handleRefresh} size="lg" className="gap-2">
          <RotateCcw className="h-5 w-5" />
          Refresh for New Matches
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto py-8 px-4">
      {/* Progress Indicator */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            {currentIndex + 1} / {members.length}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-gradient-to-r from-pink-600 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / members.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Card Stack */}
      <div className="relative w-full h-[600px] mb-8">
        {/* Show current card and next 2 cards for stack effect */}
        {members.slice(currentIndex, currentIndex + 3).map((member, index) => (
          <div
            key={member.userId}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              zIndex: 3 - index,
              transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
              opacity: index === 0 ? 1 : 0.5,
              pointerEvents: index === 0 ? "auto" : "none",
            }}
          >
            {index === 0 && (
              <SwipeCard
                member={member}
                avatarUrl={avatarUrls[member.userId] || null}
                onSwipe={handleSwipe}
                onInfoClick={handleViewProfile}
              />
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 justify-center">
        {/* Undo Button */}
        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl transition-all"
          onClick={handleUndo}
          disabled={currentIndex === 0 || isProcessing}
        >
          <RotateCcw className="h-6 w-6" />
        </Button>

        {/* Dislike/Pass Button */}
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full w-16 h-16 p-0 shadow-lg hover:shadow-xl transition-all hover:scale-110"
          onClick={() => handleSwipe("left")}
          disabled={isProcessing}
        >
          <X className="h-8 w-8" strokeWidth={3} />
        </Button>

        {/* Like Button */}
        <Button
          size="lg"
          className="rounded-full w-20 h-20 p-0 shadow-lg hover:shadow-xl transition-all hover:scale-110 bg-gradient-to-r from-pink-600 to-purple-600"
          onClick={() => handleSwipe("right")}
          disabled={isProcessing}
        >
          <Heart className="h-10 w-10 fill-white" />
        </Button>

        {/* Info Button */}
        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl transition-all"
          onClick={handleViewProfile}
          disabled={isProcessing}
        >
          <Info className="h-6 w-6" />
        </Button>
      </div>

      {/* Matching Game Modal */}
      {pendingSwipeMember && (
        <MatchingGameModal
          isOpen={showGameModal}
          onClose={() => {
            setShowGameModal(false);
            setPendingSwipeMember(null);
          }}
          targetUser={{
            id: pendingSwipeMember.userId,
            name: pendingSwipeMember.name,
            image: avatarUrls[pendingSwipeMember.userId] || pendingSwipeMember.image || undefined,
            interests: (pendingSwipeMember as any).interests || []
          }}
          onSuccess={handleGameSuccess}
        />
      )}
    </div>
  );
}
