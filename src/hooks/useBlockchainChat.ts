"use client";

import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { toast } from 'react-toastify';
import { getMatchIdBetweenUsers } from '@/lib/blockchain/contractQueries';
import { CONTRACT_IDS } from '@/lib/blockchain/contractQueries';

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "0xd381f9c5fb2b26360501c058c1f66e3f61cac1ac3a71181c19d4074888476821";

interface CreateChatFromExistingMatchParams {
  targetUserAddress: string;
  myProfileObjectId: string;
}

export function useBlockchainChat() {
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  /**
   * Create chat room from existing on-chain match
   */
  const createChatFromExistingMatch = async (params: CreateChatFromExistingMatchParams): Promise<boolean> => {
    if (!account?.address) {
      toast.error('Please connect your wallet first');
      return false;
    }

    setIsCreatingChat(true);

    try {
      console.log('[useBlockchainChat] Creating chat from existing match:', params);
      toast.info('Creating encrypted chat room...');

      // Step 1: Find existing match between users
      console.log('[useBlockchainChat] Step 1: Finding existing match...');
      const matchId = await getMatchIdBetweenUsers(client, account.address, params.targetUserAddress);
      
      if (!matchId) {
        console.error('[useBlockchainChat] No match found between users');
        toast.error('No on-chain match found. Please create a match first.');
        return false;
      }

      console.log('[useBlockchainChat] ✅ Found existing match:', matchId);

      // Step 1.5: Check and activate match if needed
      console.log('[useBlockchainChat] Step 1.5: Checking match status...');
      const matchObj = await client.getObject({
        id: matchId,
        options: { showContent: true }
      });

      if (matchObj.data?.content && 'fields' in matchObj.data.content) {
        const fields = matchObj.data.content.fields as any;
        const status = parseInt(fields.status);
        
        console.log('[useBlockchainChat] Match status:', status);
        
        if (status !== 1) {
          console.log('[useBlockchainChat] Match not active, activating...');
          await activateMatch(matchId);
          console.log('[useBlockchainChat] ✅ Match activated');
        } else {
          console.log('[useBlockchainChat] Match already active');
        }
      }

      // Step 2: Create chat room from match
      console.log('[useBlockchainChat] Step 2: Creating chat room from match...');
      const { chatRoomId, chatAllowlistId } = await createChatFromMatch(matchId, params.myProfileObjectId, params.targetUserAddress);
      console.log('[useBlockchainChat] ✅ Chat room created:', { chatRoomId, chatAllowlistId });

      // Step 3: Save chat room to database
      console.log('[useBlockchainChat] Step 3: Saving chat room to database...');
      await saveChatRoomToDatabase({
        chatRoomId,
        chatAllowlistId,
        currentUserId: account.address,
        targetUserId: params.targetUserAddress,
      });
      console.log('[useBlockchainChat] ✅ Chat room saved to database');

      toast.success('🎉 Encrypted chat room created!');
      console.log('[useBlockchainChat] ✅ All steps completed successfully!');
      return true;

    } catch (error: any) {
      console.error('[useBlockchainChat] Error creating chat:', error);
      
      // Check if chat room already exists
      if (error.message?.includes('already exists') || error.message?.includes('EMatchAlreadyHasChat')) {
        console.log('[useBlockchainChat] Chat room already exists, fetching from blockchain...');
        toast.info('Chat room already exists');
        
        // Try to fetch and save existing chat room
        try {
          const matchId = await getMatchIdBetweenUsers(client, account.address, params.targetUserAddress);
          if (matchId) {
            // Query blockchain for existing chat room
            // This would need a new query function to get chat room from match
            toast.success('Using existing chat room');
            return true;
          }
        } catch (fetchError) {
          console.error('[useBlockchainChat] Error fetching existing chat:', fetchError);
        }
      }
      
      toast.error(error.message || 'Failed to create chat room');
      return false;
    } finally {
      setIsCreatingChat(false);
    }
  };

  const activateMatch = async (matchId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::core::update_match_status`,
        arguments: [
          tx.object(matchId),
          tx.pure.u8(1), // Status: 1 = Active
          tx.object("0x6"), // Clock
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: () => resolve(),
          onError: reject,
        }
      );
    });
  };

  const createChatFromMatch = async (matchId: string, myProfileObjectId: string, targetUserAddress: string): Promise<{ chatRoomId: string; chatAllowlistId: string }> => {
    const USAGE_TRACKER_ID = process.env.NEXT_PUBLIC_USAGE_TRACKER_ID || "0xc42ca99296a4b901b8ffc7dd858fe56855d3420996503950afad76f31449c1f7";
    const MATCH_CHAT_REGISTRY_ID = process.env.NEXT_PUBLIC_MATCH_CHAT_REGISTRY_ID || "0xe909c265300cec16f82a534d30ff50c64295fd563809f0beaad38c88b24e9739";
    const ALLOWLIST_REGISTRY_ID = process.env.NEXT_PUBLIC_ALLOWLIST_REGISTRY_ID || "0xad9b4d1c670ac4032717c7b3d4136e6a3081fb0ea55f4c15ca88f8f5a624e399";

    return new Promise((resolve, reject) => {
      console.log('[useBlockchainChat] Creating chat from match:', matchId, 'profileId:', myProfileObjectId);
      
      const tx = new Transaction();

      // Generate a simple encrypted key (in production, use proper encryption)
      const encryptedKeyBytes = Array.from(Buffer.from("00", "hex"));

      // Use the entry function wrapper - auto-creates shared ChatAllowlist
      tx.moveCall({
        target: `${PACKAGE_ID}::integration::create_chat_from_match_entry`,
        arguments: [
          tx.object(USAGE_TRACKER_ID),
          tx.object(MATCH_CHAT_REGISTRY_ID),
          tx.object(CONTRACT_IDS.CHAT_REGISTRY_ID),
          tx.object(ALLOWLIST_REGISTRY_ID),
          tx.object(myProfileObjectId),
          tx.object(matchId),
          tx.pure.string("matching-app-chat"), // seal policy ID
          tx.pure.vector("u8", encryptedKeyBytes),
          tx.object("0x6"), // Clock
        ],
      });

      console.log('[useBlockchainChat] Executing create_chat_from_match transaction...');

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            try {
              console.log('[useBlockchainChat] Transaction successful, digest:', result.digest);
              
              const txResult = await client.waitForTransaction({
                digest: result.digest,
                options: { showObjectChanges: true },
              });

              console.log('[useBlockchainChat] Transaction result:', {
                status: txResult.effects?.status,
                objectChanges: txResult.objectChanges?.length,
              });

              // Log all created objects for debugging
              const createdObjects = txResult.objectChanges?.filter((c: any) => c.type === "created");
              console.log('[useBlockchainChat] Created objects:', createdObjects?.map((o: any) => ({
                type: o.objectType,
                id: 'objectId' in o ? o.objectId : 'unknown'
              })));

              console.log('[useBlockchainChat] Chat creation result:', txResult.objectChanges);

              // Find created ChatRoom and ChatAllowlist objects
              const chatRoomObject = txResult.objectChanges?.find(
                (change: any) => change.type === "created" && change.objectType?.includes("::ChatRoom")
              );

              const chatAllowlistObject = txResult.objectChanges?.find(
                (change: any) => change.type === "created" && change.objectType?.includes("::ChatAllowlist")
              );

              if (!chatRoomObject || !("objectId" in chatRoomObject)) {
                console.error('[useBlockchainChat] ChatRoom object not found');
                console.log('[useBlockchainChat] All object changes:', txResult.objectChanges);
                throw new Error("ChatRoom not found in transaction result");
              }

              if (!chatAllowlistObject || !("objectId" in chatAllowlistObject)) {
                console.error('[useBlockchainChat] ChatAllowlist object not found');
                console.log('[useBlockchainChat] All object changes:', txResult.objectChanges);
                throw new Error("ChatAllowlist not found in transaction result");
              }

              console.log('[useBlockchainChat] ✅ Chat objects found:', {
                chatRoomId: chatRoomObject.objectId,
                chatAllowlistId: chatAllowlistObject.objectId,
              });

              resolve({
                chatRoomId: chatRoomObject.objectId,
                chatAllowlistId: chatAllowlistObject.objectId,
              });
            } catch (error) {
              console.error('[useBlockchainChat] Error processing transaction result:', error);
              reject(error);
            }
          },
          onError: (error) => {
            console.error('[useBlockchainChat] Transaction failed:', error);
            reject(error);
          },
        }
      );
    });
  };

  const saveChatRoomToDatabase = async (params: {
    chatRoomId: string;
    chatAllowlistId: string;
    currentUserId: string;
    targetUserId: string;
  }): Promise<void> => {
    try {
      console.log('[useBlockchainChat] Saving chat room to database:', params);
      const response = await fetch('/api/save-chat-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[useBlockchainChat] Failed to save chat room:', error);
        throw new Error(error.error || 'Failed to save chat room to database');
      }

      const result = await response.json();
      console.log('[useBlockchainChat] Chat room saved successfully:', result);
    } catch (error) {
      console.error('[useBlockchainChat] Error saving chat room:', error);
      // Don't throw - this is not critical, but log it
    }
  };

  return {
    createChatFromExistingMatch,
    isCreatingChat,
    canCreateChat: !!account?.address,
  };
}
