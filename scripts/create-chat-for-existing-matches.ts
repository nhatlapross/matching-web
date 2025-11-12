/**
 * Script to create chat rooms for existing on-chain matches
 * Run with: npx tsx scripts/create-chat-for-existing-matches.ts
 */

import { prisma } from '../src/lib/prisma';

async function findMatchesWithoutChatRooms() {
  console.log('🔍 Finding mutual matches without chat rooms...\n');

  // Find all mutual matches (matchStatus = 1)
  const mutualMatches = await prisma.like.findMany({
    where: {
      matchStatus: 1,
    },
    select: {
      sourceUserId: true,
      targetUserId: true,
      matchId: true,
      sourceMember: {
        select: {
          name: true,
          user: {
            select: {
              walletAddress: true,
              profileObjectId: true,
            }
          }
        }
      },
      targetMember: {
        select: {
          name: true,
          user: {
            select: {
              walletAddress: true,
              profileObjectId: true,
            }
          }
        }
      }
    }
  });

  console.log(`Found ${mutualMatches.length} likes with matchStatus = 1\n`);

  // Group by match pairs
  const matchPairs = new Map<string, typeof mutualMatches[0]>();
  
  for (const match of mutualMatches) {
    const pairKey = [match.sourceUserId, match.targetUserId].sort().join(':');
    if (!matchPairs.has(pairKey)) {
      matchPairs.set(pairKey, match);
    }
  }

  console.log(`Found ${matchPairs.size} unique match pairs\n`);

  // Check which ones don't have chat rooms
  const matchesWithoutChat: Array<{
    user1: string;
    user2: string;
    user1Name: string;
    user2Name: string;
    user1Wallet: string | null;
    user2Wallet: string | null;
    user1ProfileId: string | null;
    user2ProfileId: string | null;
    matchId: string | null;
  }> = [];

  for (const [pairKey, match] of matchPairs) {
    const [user1, user2] = pairKey.split(':');
    
    // Check if chat room exists
    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        OR: [
          { participant1: user1, participant2: user2 },
          { participant1: user2, participant2: user1 },
        ]
      }
    });

    if (!chatRoom) {
      matchesWithoutChat.push({
        user1,
        user2,
        user1Name: match.sourceMember.name,
        user2Name: match.targetMember.name,
        user1Wallet: match.sourceMember.user?.walletAddress || null,
        user2Wallet: match.targetMember.user?.walletAddress || null,
        user1ProfileId: match.sourceMember.user?.profileObjectId || null,
        user2ProfileId: match.targetMember.user?.profileObjectId || null,
        matchId: match.matchId,
      });
    }
  }

  console.log(`\n📊 SUMMARY:`);
  console.log(`Total mutual matches: ${matchPairs.size}`);
  console.log(`Matches with chat rooms: ${matchPairs.size - matchesWithoutChat.length}`);
  console.log(`Matches WITHOUT chat rooms: ${matchesWithoutChat.length}\n`);

  if (matchesWithoutChat.length > 0) {
    console.log('🔧 Matches that need chat rooms:\n');
    
    for (const match of matchesWithoutChat) {
      console.log(`Match: ${match.user1Name} ↔ ${match.user2Name}`);
      console.log(`  User 1: ${match.user1}`);
      console.log(`    Wallet: ${match.user1Wallet || '❌ Missing'}`);
      console.log(`    ProfileId: ${match.user1ProfileId || '❌ Missing'}`);
      console.log(`  User 2: ${match.user2}`);
      console.log(`    Wallet: ${match.user2Wallet || '❌ Missing'}`);
      console.log(`    ProfileId: ${match.user2ProfileId || '❌ Missing'}`);
      console.log(`  Match ID: ${match.matchId || '❌ Not on-chain'}`);
      
      const canCreateChat = !!(
        match.user1Wallet && 
        match.user2Wallet && 
        match.user1ProfileId && 
        match.user2ProfileId &&
        match.matchId
      );
      
      console.log(`  Can create chat: ${canCreateChat ? '✅ Yes' : '❌ No (missing data)'}`);
      console.log('');
    }

    console.log('\n💡 To create chat rooms:');
    console.log('1. Go to the chat page with the matched user');
    console.log('2. Click "Create Encrypted Chat" button');
    console.log('3. Or use the useBlockchainChat hook in your component\n');
  } else {
    console.log('✅ All matches have chat rooms!\n');
  }

  await prisma.$disconnect();
}

findMatchesWithoutChatRooms().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
