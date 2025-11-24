-- AlterTable
ALTER TABLE "public"."File" ADD COLUMN     "publicId" TEXT NOT NULL DEFAULT 'MIGRATED_NO_ID',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "File_chatId_idx" ON "public"."File"("chatId");
