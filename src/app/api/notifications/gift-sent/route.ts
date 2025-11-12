import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      recipientAddress,
      senderAddress,
      giftType,
      giftEmoji,
      amount,
      message,
      transactionDigest,
      isSuiTransfer = false,
    } = body;

    if (!recipientAddress || !senderAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get sender info
    const senderMember = await prisma.member.findUnique({
      where: { userId: senderAddress },
      select: {
        name: true,
        image: true,
        userId: true,
      }
    });

    const senderName = senderMember?.name || 'Someone';
    const senderImage = senderMember?.image;

    // Send notification to recipient
    await pusherServer.trigger(`private-${recipientAddress}`, 'gift:received', {
      senderId: senderAddress,
      senderName,
      senderImage,
      giftType,
      giftEmoji,
      amount,
      message,
      transactionDigest,
      isSuiTransfer,
      timestamp: new Date().toISOString(),
    });

    // Send confirmation to sender
    await pusherServer.trigger(`private-${senderAddress}`, 'gift:sent', {
      recipientId: recipientAddress,
      giftType,
      giftEmoji,
      amount,
      message,
      transactionDigest,
      isSuiTransfer,
      timestamp: new Date().toISOString(),
    });

    console.log('[gift-sent] Notifications sent:', {
      sender: senderAddress,
      recipient: recipientAddress,
      giftType,
    });

    return NextResponse.json({
      success: true,
      message: 'Notifications sent',
    });
  } catch (error: any) {
    console.error('[gift-sent] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
