import CardInnerWrapper from "@/components/CardInnerWrapper";
import React from "react";
import ChatForm from "./ChatForm";
import ChatFormWithBlockchain from "./ChatFormWithBlockchain";
import { getMessageThread } from "@/app/actions/messageActions";
import { getAuthUserId } from "@/app/actions/authActions";
import { getChatRoomByParticipants } from "@/app/actions/matchOnChainActions";
import { getMemberByUserId } from "@/app/actions/memberActions";
import { createChatId } from "@/lib/util";
import { prisma } from "@/lib/prisma";
import dynamic from "next/dynamic";
import CreateChatRoomButton from "@/components/CreateChatRoomButton";

const MessageList = dynamic(() => import("./MessageList"), {
  ssr: false,
  loading: () => <div className="text-center p-4">Loading messages...</div>
});

export default async function ChatPage({
  params,
}: {
  params: { userId: string };
}) {
  const messages = await getMessageThread(
    params.userId
  );
  const userId = await getAuthUserId();

  const chatId = createChatId(
    userId,
    params.userId
  );

  // Check if on-chain chat room exists
  // params.userId is the target user's wallet address
  const chatRoom = await getChatRoomByParticipants(userId, params.userId);

  // Get recipient member info for gift feature
  const recipientMember = await getMemberByUserId(params.userId);

  // Check if users have mutual match (for showing create chat button)
  const hasMutualMatch = await prisma.like.count({
    where: {
      OR: [
        { sourceUserId: userId, targetUserId: params.userId },
        { sourceUserId: params.userId, targetUserId: userId },
      ],
      matchStatus: 1, // Active match
    }
  }) === 2;

  // Get current user's profile object ID
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { profileObjectId: true }
  });
  const myProfileObjectId = currentUser?.profileObjectId;

  return (
    <CardInnerWrapper
      header={chatRoom ? "Encrypted Chat" : "Chat"}
      body={
        <>
          {/* Show create chat button if mutual match exists but no chat room */}
          {!chatRoom && hasMutualMatch && myProfileObjectId && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                🔒 You have a match! Create an encrypted chat room on blockchain for secure messaging.
              </p>
              <CreateChatRoomButton
                targetUserAddress={params.userId}
                myProfileObjectId={myProfileObjectId}
                targetUserName={recipientMember?.name}
                variant="default"
                size="sm"
              />
            </div>
          )}
          
          {!chatRoom && hasMutualMatch && !myProfileObjectId && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                ⚠️ You need to create an on-chain profile first to use encrypted chat.
              </p>
            </div>
          )}
          
          <MessageList
            initialMessages={messages}
            currentUserId={userId}
            chatId={chatId}
            chatRoomId={chatRoom?.chatRoomId}
            chatAllowlistId={chatRoom?.chatAllowlistId}
            recipientId={params.userId}
          />
        </>
      }
      footer={
        chatRoom ? (
          <ChatFormWithBlockchain
            chatRoomId={chatRoom.chatRoomId}
            chatAllowlistId={chatRoom.chatAllowlistId}
            recipientAddress={params.userId}
            recipientName={recipientMember?.name || undefined}
          />
        ) : (
          <ChatForm />
        )
      }
    />
  );
}
