import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { extractFaceDescriptor } from '@/utils/faceVerification';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL provided' }, { status: 400 });
    }

    // Get user's reference face
    const member = await prisma.member.findUnique({
      where: { userId: session.user.id },
      select: {
        referenceFaceLandmarks: true,
        faceVerificationEnabled: true,
      },
    });

    if (!member || !member.faceVerificationEnabled) {
      return NextResponse.json({
        verified: true,
        message: 'Face verification not enabled',
      });
    }

    if (!member.referenceFaceLandmarks) {
      return NextResponse.json({
        verified: false,
        message: 'No reference face found',
      }, { status: 400 });
    }

    // Extract descriptor from uploaded image
    const uploadedDescriptor = await extractFaceDescriptor(imageUrl);

    if (!uploadedDescriptor) {
      return NextResponse.json({
        verified: false,
        message: 'No face detected in image',
      }, { status: 400 });
    }

    // Parse reference descriptor
    const referenceDescriptorArray = JSON.parse(member.referenceFaceLandmarks as string);
    const referenceDescriptor = {
      descriptor: new Float32Array(referenceDescriptorArray),
    };

    // Compare faces
    const faceapi = await import('face-api.js');
    const distance = faceapi.euclideanDistance(
      referenceDescriptor.descriptor,
      uploadedDescriptor.descriptor
    );

    const similarityScore = Math.round((1 - distance) * 100);
    const isMatch = distance < 0.55; // Threshold for face match

    if (!isMatch) {
      return NextResponse.json({
        verified: false,
        message: `Face doesn't match reference face (match: ${similarityScore}%)`,
        distance,
        similarityScore,
      }, { status: 403 });
    }

    return NextResponse.json({
      verified: true,
      message: `Verification successful (match: ${similarityScore}%)`,
      distance,
      similarityScore,
    });
  } catch (error) {
    console.error('Error verifying face:', error);
    return NextResponse.json(
      { error: 'Failed to verify face' },
      { status: 500 }
    );
  }
}
