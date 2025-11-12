"use client";

import { Button } from "@/components/ui/button";
import { useBlockchainChat } from "@/hooks/useBlockchainChat";
import { MessageSquarePlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateChatRoomButtonProps {
  targetUserAddress: string;
  myProfileObjectId: string;
  targetUserName?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function CreateChatRoomButton({
  targetUserAddress,
  myProfileObjectId,
  targetUserName,
  variant = "default",
  size = "default",
  className,
}: CreateChatRoomButtonProps) {
  const router = useRouter();
  const { createChatFromExistingMatch, isCreatingChat, canCreateChat } = useBlockchainChat();

  const handleCreateChat = async () => {
    if (!canCreateChat) {
      alert("Please connect your wallet first");
      return;
    }

    if (!myProfileObjectId) {
      alert("You need to create an on-chain profile first");
      return;
    }

    const success = await createChatFromExistingMatch({
      targetUserAddress,
      myProfileObjectId,
    });

    if (success) {
      // Refresh the page to show the new chat room
      router.refresh();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCreateChat}
      disabled={isCreatingChat || !canCreateChat}
      className={className}
    >
      {isCreatingChat ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Create Encrypted Chat
          {targetUserName && ` with ${targetUserName}`}
        </>
      )}
    </Button>
  );
}
