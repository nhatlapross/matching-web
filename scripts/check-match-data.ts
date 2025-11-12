import { prisma } from '../src/lib/prisma';

async function checkMatchData() {
  const user1 = '0x142c0f39b0dbf388dd870d8a03d58ab95752b86f6616f0a1459db373c9aaf00f';
  const user2 = '0x50d7e4ce4f192f014a4be6c0031ae8cfad1446e3e56f66326c07584ddfca9787';

  console.log('Checking match data for users:');
  console.log('User 1:', user1);
  console.log('User 2:', user2);
  console.log('');

  // Check User 1
  const member1 = await prisma.member.findUnique({
    where: { userId: user1 },
    select: {
      userId: true,
      name: true,
      user: {
        select: {
          walletAddress: true,
          profileObjectId: true,
        }
      }
    }
  });

  console.log('User 1 data:', {
    userId: member1?.userId,
    name: member1?.name,
    walletAddress: member1?.user?.walletAddress,
    profileObjectId: member1?.user?.profileObjectId,
    hasProfileObjectId: !!member1?.user?.profileObjectId,
  });
  console.log('');

  // Check User 2
  const member2 = await prisma.member.findUnique({
    where: { userId: user2 },
    select: {
      userId: true,
      name: true,
      user: {
        select: {
          walletAddress: true,
          profileObjectId: true,
        }
      }
    }
  });

  console.log('User 2 data:', {
    userId: member2?.userId,
    name: member2?.name,
    walletAddress: member2?.user?.walletAddress,
    profileObjectId: member2?.user?.profileObjectId,
    hasProfileObjectId: !!member2?.user?.profileObjectId,
  });
  console.log('');

  // Check likes
  const likes = await prisma.like.findMany({
    where: {
      OR: [
        { sourceUserId: user1, targetUserId: user2 },
        { sourceUserId: user2, targetUserId: user1 },
      ]
    },
    select: {
      sourceUserId: true,
      targetUserId: true,
      matchStatus: true,
      matchId: true,
      createdAt: true,
    }
  });

  console.log('Likes:', likes);
  console.log('');

  // Check chat room
  const chatRoom = await prisma.chatRoom.findFirst({
    where: {
      OR: [
        { participant1: user1, participant2: user2 },
        { participant1: user2, participant2: user1 },
      ]
    }
  });

  console.log('Chat room:', chatRoom || 'Not found');
  console.log('');

  // Summary
  console.log('=== SUMMARY ===');
  console.log('Both users have profileObjectId:', !!(member1?.user?.profileObjectId && member2?.user?.profileObjectId));
  console.log('Mutual match exists:', likes.length === 2);
  console.log('Chat room exists:', !!chatRoom);
  console.log('');

  if (!member1?.user?.profileObjectId) {
    console.log('⚠️  User 1 missing profileObjectId - need to create on-chain profile');
  }
  if (!member2?.user?.profileObjectId) {
    console.log('⚠️  User 2 missing profileObjectId - need to create on-chain profile');
  }
  if (!chatRoom && likes.length === 2) {
    console.log('⚠️  Mutual match exists but no chat room - need to create on-chain match');
  }

  await prisma.$disconnect();
}

checkMatchData().catch(console.error);
