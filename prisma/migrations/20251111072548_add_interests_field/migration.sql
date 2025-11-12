-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[];
