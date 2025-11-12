-- CreateIndex
CREATE INDEX "ChatRoom_participant1_participant2_idx" ON "ChatRoom"("participant1", "participant2");

-- CreateIndex
CREATE INDEX "ChatRoom_chatRoomId_idx" ON "ChatRoom"("chatRoomId");
