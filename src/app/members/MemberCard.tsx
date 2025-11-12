"use client";
import LikeButton from "@/components/LikeButton";
import LikeButtonWithBlockchain from "@/components/LikeButtonWithBlockchain";
import PresenceDot from "@/components/PresenceDot";
import { MatchingGameModal } from "@/components/matching-games";

import { calculateAge } from "@/lib/util";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Member } from "@prisma/client";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { MapPin, Verified } from "lucide-react";
import Image from "next/image";
import { pusherClient } from "@/lib/pusher";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useBlockchainMatch } from "@/hooks/useBlockchainMatch";

type Props = {
  member: Member & {
    user?: {
      profileObjectId: string | null;
      walletAddress: string | null;
    };
  };
  likeIds: string[];
  myProfileObjectId?: string | null;
  currentUserId?: string;
};

export default function MemberCard({ member, likeIds, myProfileObjectId, currentUserId }: Props) {
  const router = useRouter();
  const { createMatchOnChain, isCreatingMatch, canCreateMatch } = useBlockchainMatch();
  const hasLiked = likeIds.includes(member.userId);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);
  const [showGameModal, setShowGameModal] = useState(false);

  // Use blockchain-enabled button if both users have on-chain profiles
  const useBlockchainLike = !!(myProfileObjectId && member.user?.walletAddress);

  // Extract fetchAvatar as a callback so it can be reused
  const fetchAvatar = useCallback(async () => {
    setIsLoadingAvatar(true);
    try {
      console.log(`🔍 [MemberCard] Fetching avatar for ${member.name}:`, {
        targetUserId: member.userId,
        viewerUserId: currentUserId,
        hasCurrentUser: !!currentUserId
      });

      const { getAvatarForUser } = await import('@/app/actions/avatarActions');
      const result = await getAvatarForUser(member.userId, currentUserId);

      console.log(`📸 [MemberCard] Avatar result for ${member.name}:`, {
        status: result.status,
        type: result.data?.type,
        isEncrypted: result.data?.isEncrypted,
        hasAccess: result.data?.hasAccess,
        url: result.data?.url?.substring(0, 50) + '...'
      });

      if (result.status === 'success' && result.data) {
        setAvatarUrl(result.data.url);
      } else {
        // Fallback to member.image
        console.warn(`⚠️ [MemberCard] Avatar fetch failed for ${member.name}, using fallback`);
        setAvatarUrl(member.image);
      }
    } catch (error) {
      console.error(`❌ [MemberCard] Failed to fetch avatar for ${member.name}:`, error);
      setAvatarUrl(member.image);
    } finally {
      setIsLoadingAvatar(false);
    }
  }, [member.userId, currentUserId, member.image, member.name]);

  // Fetch appropriate avatar based on match status on mount
  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  // ✅ Listen for real-time avatar refresh events when users match
  useEffect(() => {
    if (!currentUserId) return;

    console.log(`🔌 [MemberCard] Subscribing to avatar:refresh for user ${currentUserId}`);
    const channel = pusherClient.subscribe(`private-${currentUserId}`);

    channel.bind('avatar:refresh', (data: { userId: string; reason: string }) => {
      console.log('🔄 [MemberCard] Avatar refresh event received:', data);

      // Refetch avatar if this is the user whose avatar should be refreshed
      if (data.userId === member.userId) {
        console.log(`✅ [MemberCard] Refreshing avatar for ${member.name} due to ${data.reason}`);
        fetchAvatar();
      }
    });

    return () => {
      console.log(`🔌 [MemberCard] Unsubscribing from avatar:refresh for user ${currentUserId}`);
      channel.unbind('avatar:refresh');
      pusherClient.unsubscribe(`private-${currentUserId}`);
    };
  }, [currentUserId, member.userId, fetchAvatar, member.name]);

  console.log("[MemberCard] Render:", {
    memberId: member.userId,
    memberName: member.name,
    useBlockchainLike,
    myProfileObjectId,
    memberWalletAddress: member.user?.walletAddress,
    avatarUrl
  });

  const preventLinkAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle like button click - show game modal instead of direct like
  const handleLikeClick = (e: React.MouseEvent) => {
    // ✅ CRITICAL: Prevent link navigation
    e.preventDefault();
    e.stopPropagation();
    
    if (hasLiked) {
      // If already liked, allow unlike directly
      handleUnlike();
    } else {
      // Show game modal for new likes
      setShowGameModal(true);
    }
  };

  // Handle game completion - send like
  const handleGameSuccess = async () => {
    try {
      console.log('[MemberCard] Game completed, sending like to:', member.userId);
      
      // Create like in database and check for mutual match
      const { toggleLikeMember } = await import('@/app/actions/likeActions');
      const result = await toggleLikeMember(member.userId, false); // ✅ false = add like
      
      console.log('[MemberCard] toggleLikeMember result:', result);
      
      // Check if this created a mutual match
      if (result?.isMatch) {
        console.log('[MemberCard] 🎉 Mutual match detected!');
        toast.success(`🎉 It's a match with ${member.name}!`, {
          position: "top-center",
        });
        
        // ✅ Create on-chain match if both users have blockchain profiles
        const targetWalletAddress = result.targetUser?.walletAddress;
        const targetProfileObjectId = result.targetUser?.profileObjectId;

        console.log('[MemberCard] Blockchain match check:', {
          myProfileObjectId,
          targetWalletAddress,
          targetProfileObjectId,
          canCreateMatch,
          hasAllData: !!(myProfileObjectId && targetWalletAddress && targetProfileObjectId && canCreateMatch)
        });

        if (myProfileObjectId && targetWalletAddress && targetProfileObjectId && canCreateMatch) {
          console.log('[MemberCard] ✅ Creating on-chain match...');

          // Create blockchain match in background (don't block UI)
          createMatchOnChain({
            targetUserAddress: targetWalletAddress,
            myProfileObjectId: myProfileObjectId,
            compatibilityScore: 95
          }).then((success) => {
            if (success) {
              console.log('[MemberCard] ✅ On-chain match created successfully!');
              toast.success('✨ Match recorded on blockchain!');
            } else {
              console.log('[MemberCard] ❌ On-chain match creation returned false');
            }
          }).catch((error) => {
            console.error('[MemberCard] ❌ Failed to create on-chain match:', error);
            // Don't show error toast - match is already created in database
          });
        } else {
          console.log('[MemberCard] ⚠️ Skipping on-chain match - missing data or wallet not connected');
        }
      } else {
        console.log('[MemberCard] Not a mutual match, just a like');
        toast.success(`🎉 Game completed! Like sent to ${member.name}`);
      }
      
      // Refresh data without full page reload
      router.refresh();
    } catch (error) {
      console.error('[MemberCard] ❌ Failed to send like:', error);
      toast.error('Failed to send like. Please try again.');
    }
  };

  // Handle unlike
  const handleUnlike = async () => {
    try {
      const { toggleLikeMember } = await import('@/app/actions/likeActions');
      await toggleLikeMember(member.userId, true); // ✅ true = removing like
      toast.info(`Unliked ${member.name}`);
      router.refresh();
    } catch (error: any) {
      console.error('Failed to unlike:', error);
      // Don't show error if record doesn't exist (already unliked)
      if (error?.code !== 'P2025') {
        toast.error('Failed to unlike. Please try again.');
      } else {
        // Already unliked, just refresh
        router.refresh();
      }
    }
  };

  return (
    <div className="group block relative">
      <Link href={`/members/${member.userId}`}>
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-0 relative">
            {/* Image Container with Overlay */}
            <div className="relative aspect-[3/4] overflow-hidden">
              {/* Loading Skeleton */}
              {isLoadingAvatar && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse z-10" />
              )}
              
              {/* Avatar with match-based display */}
              <Image
                alt={member.name}
                fill
                src={avatarUrl || "/images/user.png"}
                className={`object-cover transition-transform duration-700 group-hover:scale-110 ${
                  isLoadingAvatar ? 'opacity-0' : 'opacity-100'
                }`}
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                onError={() => {
                  console.log('Image load failed, falling back to placeholder');
                  setAvatarUrl("/images/user.png");
                  setIsLoadingAvatar(false);
                }}
                onLoad={() => setIsLoadingAvatar(false)}
              />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

            {/* Top Actions */}
            <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start z-20">
              <div className="flex gap-2 items-center pointer-events-none">
                <PresenceDot member={member} />
                {member.userId && (
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-colors">
                    <Verified className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {member.name}
                  </h3>
                  <span className="text-lg font-medium text-white/90">
                    {calculateAge(member.dateOfBirth)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-white/80">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-sm font-medium">
                    {member.city}
                  </span>
                </div>
              </div>

              {/* Hover: Show Description Preview */}
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-h-0 group-hover:max-h-20 overflow-hidden">
                <p className="text-sm text-white/70 line-clamp-2">
                  {member.description || "No description available"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </Link>

      {/* Like Button - Outside Link to prevent navigation */}
      <div className="absolute top-3 right-3 z-30">
        <button
          onClick={handleLikeClick}
          type="button"
          className={`p-2 rounded-full backdrop-blur-sm transition-all transform hover:scale-110 ${
            hasLiked 
              ? 'bg-pink-500 hover:bg-pink-600' 
              : 'bg-background/80 hover:bg-background/90'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={`h-6 w-6 transition-colors ${
              hasLiked ? 'fill-white' : 'fill-none stroke-current'
            }`}
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Matching Game Modal */}
      <MatchingGameModal
        isOpen={showGameModal}
        onClose={() => setShowGameModal(false)}
        targetUser={{
          id: member.userId,
          name: member.name,
          image: avatarUrl || member.image || undefined,
          interests: (member as any).interests || []
        }}
        onSuccess={handleGameSuccess}
      />
    </div>
  );
}
