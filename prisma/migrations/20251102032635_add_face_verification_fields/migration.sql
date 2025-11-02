-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "faceVerificationEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referenceFaceLandmarks" JSONB,
ADD COLUMN     "referenceFaceUploadedAt" TIMESTAMP(3),
ADD COLUMN     "referenceFaceUrl" TEXT;

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "faceLandmarks" JSONB,
ADD COLUMN     "faceVerificationScore" DOUBLE PRECISION,
ADD COLUMN     "faceVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);
