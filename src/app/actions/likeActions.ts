'use server';

import { prisma } from '@/lib/prisma';
import { getAuthUserId } from './authActions';
import { pusherServer } from '@/lib/pusher';
import { MatchEventHandler } from '@/services/matchEventHandler';

export async function toggleLikeMember(targetUserId: string, isLiked: boolean) {
    try {
        const userId = await getAuthUserId();
        const matchEventHandler = new MatchEventHandler();

        if (isLiked) {
            // Removing a like
            try {
                await prisma.like.delete({
                    where: {
                        sourceUserId_targetUserId: {
                            sourceUserId: userId,
                            targetUserId
                        }
                    }
                });

                // Handle potential match deletion
                await matchEventHandler.handleLikeRemoved(userId, targetUserId);
                
                return { isMatch: false };
            } catch (error: any) {
                // If record doesn't exist (P2025), it's already unliked - just return success
                if (error.code === 'P2025') {
                    console.log('Like record already deleted or does not exist');
                    return { isMatch: false };
                }
                throw error;
            }
        } else {
            // Adding a like
            const like = await prisma.like.create({
                data: {
                    sourceUserId: userId,
                    targetUserId
                },
                select: {
                    sourceMember: {
                        select: {
                            name: true,
                            image: true,
                            userId: true
                        }
                    }
                }
            });

            // Send notification
            await pusherServer.trigger(`private-${targetUserId}`, 'like:new', {
                name: like.sourceMember.name,
                image: like.sourceMember.image,
                userId: like.sourceMember.userId
            });

            // Check for mutual match and handle avatar access
            const isMutualMatch = await matchEventHandler.detectAndHandleMutualMatch(userId, targetUserId);
            console.log('[toggleLikeMember] Mutual match check:', { isMutualMatch, userId, targetUserId });

            if (isMutualMatch) {
                console.log('[toggleLikeMember] 🎉 Mutual match detected! Fetching target user data...');
                
                // Get target user data for blockchain match
                const targetUser = await prisma.member.findUnique({
                    where: { userId: targetUserId },
                    select: {
                        name: true,
                        image: true,
                        userId: true,
                        user: {
                            select: {
                                walletAddress: true,
                                profileObjectId: true
                            }
                        }
                    }
                });

                console.log('[toggleLikeMember] Target user data:', {
                    userId: targetUser?.userId,
                    walletAddress: targetUser?.user?.walletAddress,
                    profileObjectId: targetUser?.user?.profileObjectId
                });

                // Send match notification
                await pusherServer.trigger(`private-${targetUserId}`, 'match:new', {
                    name: like.sourceMember.name,
                    image: like.sourceMember.image,
                    userId: like.sourceMember.userId,
                    message: 'You have a new match!'
                });

                await pusherServer.trigger(`private-${userId}`, 'match:new', {
                    userId: targetUserId,
                    message: 'You have a new match!'
                });

                // ✅ Trigger avatar refresh for both users
                // This tells clients to refetch avatars to show private (original) images
                console.log('🔄 Triggering avatar refresh for matched users:', { userId, targetUserId });

                await Promise.allSettled([
                    pusherServer.trigger(`private-${targetUserId}`, 'avatar:refresh', {
                        userId: userId, // The user whose avatar should be refreshed
                        reason: 'match'
                    }),
                    pusherServer.trigger(`private-${userId}`, 'avatar:refresh', {
                        userId: targetUserId, // The user whose avatar should be refreshed
                        reason: 'match'
                    })
                ]);

                return {
                    isMatch: true,
                    targetUser: {
                        userId: targetUserId,
                        name: targetUser?.name || 'Unknown',
                        walletAddress: targetUser?.user?.walletAddress || null,
                        profileObjectId: targetUser?.user?.profileObjectId || null
                    }
                };
            }

            return { isMatch: false };
        }

    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function fetchCurrentUserLikeIds() {
    try {
        const userId = await getAuthUserId();

        const likeIds = await prisma.like.findMany({
            where: {
                sourceUserId: userId
            },
            select: {
                targetUserId: true
            }
        })

        return likeIds.map(like => like.targetUserId);
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function fetchLikedMembers(type = 'source') {
    try {
        const userId = await getAuthUserId();

        switch (type) {
            case 'source':
                return await fetchSourceLikes(userId);
            case 'target':
                return await fetchTargetLikes(userId);
            case 'mutual':
                return await fetchMutualLikes(userId);
            default:
                return [];
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function fetchSourceLikes(userId: string) {
    const sourceList = await prisma.like.findMany({
        where: { sourceUserId: userId },
        select: { targetMember: true }
    })
    return sourceList.map(x => x.targetMember);
}

async function fetchTargetLikes(userId: string) {
    const targetList = await prisma.like.findMany({
        where: { targetUserId: userId },
        select: { sourceMember: true }
    })
    return targetList.map(x => x.sourceMember);
}

async function fetchMutualLikes(userId: string) {
    const likedUsers = await prisma.like.findMany({
        where: { sourceUserId: userId },
        select: { targetUserId: true }
    });
    const likedIds = likedUsers.map(x => x.targetUserId);

    const mutualList = await prisma.like.findMany({
        where: {
            AND: [
                { targetUserId: userId },
                { sourceUserId: { in: likedIds } }
            ]
        },
        select: { sourceMember: true }
    });
    return mutualList.map(x => x.sourceMember);
}