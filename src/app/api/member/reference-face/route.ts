import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { userId: session.user.id },
      select: {
        referenceFaceLandmarks: true,
        faceVerificationEnabled: true,
        referenceFaceUrl: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({
      referenceFaceLandmarks: member.referenceFaceLandmarks,
      faceVerificationEnabled: member.faceVerificationEnabled,
      referenceFaceUrl: member.referenceFaceUrl,
    });
  } catch (error) {
    console.error('Error fetching reference face:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reference face' },
      { status: 500 }
    );
  }
}
