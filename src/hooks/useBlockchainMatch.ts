"use client";

import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { toast } from 'react-toastify';
import { saveMatchOnChain } from '@/app/actions/matchOnChainActions';

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "0xd381f9c5fb2b26360501c058c1f66e3f61cac1ac3a71181c19d4074888476821";
const MATCH_REGISTRY_ID = process.env.NEXT_PUBLIC_MATCH_REGISTRY_ID || "0xcae785a9aa1022cf38e274c01ad3d28cf5dc42ae60e2a9814f7d72b06fdf567b";

interface CreateMatchParams {
  targetUserAddress: string;
  myProfileObjectId: string;
  compatibilityScore?: number;
}

export function useBlockchainMatch() {
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const createMatchOnChain = async (params: CreateMatchParams): Promise<boolean> => {
    if (!account?.address) {
      toast.error('Please connect your wallet first');
      return false;
    }

    setIsCreatingMatch(true);

    try {
      console.log('[useBlockchainMatch] Creating match on-chain:', params);
      toast.info('Creating match on blockchain...');

      // Step 1: Create match request
      const matchId = await createMatchRequest(params);
      console.log('[useBlockchainMatch] Match created:', matchId);

      // Step 2: Activate match (set status = 1)
      await activateMatch(matchId);
      console.log('[useBlockchainMatch] Match activated');

      // Step 3: Create chat room from match
      console.log('[useBlockchainMatch] Step 3: Creating chat room from match...');
      const { chatRoomId, chatAllowlistId } = await createChatFromMatch(matchId);
      console.log('[useBlockchainMatch] ✅ Chat room created successfully:', { chatRoomId, chatAllowlistId });

      // Step 4: Save match to database
      console.log('[useBlockchainMatch] Step 4: Saving match to database...');
      await saveMatchOnChain({
        matchId,
        myProfileObjectId: params.myProfileObjectId,
        targetUserAddress: params.targetUserAddress,
        compatibilityScore: params.compatibilityScore || 95,
        digest: "",
      });
      console.log('[useBlockchainMatch] ✅ Match saved to database');

      // Step 5: Save chat room to database
      console.log('[useBlockchainMatch] Step 5: Saving chat room to database...');
      await saveChatRoomToDatabase({
        chatRoomId,
        chatAllowlistId,
        currentUserId: account.address,
        targetUserId: params.targetUserAddress,
      });
      console.log('[useBlockchainMatch] ✅ Chat room saved to database');

      toast.success('🎉 Match created on blockchain!');
      console.log('[useBlockchainMatch] ✅ All steps completed successfully!');
      return true;

    } catch (error: any) {
      console.error('[useBlockchainMatch] Error creating match:', error);
      toast.error(error.message || 'Failed to create match on blockchain');
      return false;
    } finally {
      setIsCreatingMatch(false);
    }
  };

  const createMatchRequest = async (params: CreateMatchParams): Promise<string> => {
    return new Promise((resolve, reject) => {
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::core::create_match_request`,
        arguments: [
          tx.object(MATCH_REGISTRY_ID),
          tx.object(params.myProfileObjectId),
          tx.pure.address(params.targetUserAddress),
          tx.pure.u64(params.compatibilityScore || 95),
          tx.pure.bool(true),
          tx.object("0x6"), // Clock
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            try {
              const txResult = await client.waitForTransaction({
                digest: result.digest,
                options: { showObjectChanges: true },
              });

              const matchObject = txResult.objectChanges?.find(
                (change: any) => change.type === "created" && change.objectType?.includes("::core::Match")
              );

              if (!matchObject || !("objectId" in matchObject)) {
                throw new Error("Match object not found");
              }

              resolve(matchObject.objectId);
            } catch (error) {
              reject(error);
            }
          },
          onError: reject,
        }
      );
    });
  };

  const activateMatch = async (matchId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::core::update_match_status`,
        arguments: [
          tx.object(matchId),
          tx.pure.u8(1), // Status: 1 = Active
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

  const createChatFromMatch = async (matchId: string): Promise<{ chatRoomId: string; chatAllowlistId: string }> => {
    return new Promise((resolve, reject) => {
      console.log('[useBlockchainMatch] Creating chat from match:', matchId);
      
      const tx = new Transaction();

      const [chatRoom, chatAllowlist] = tx.moveCall({
        target: `${PACKAGE_ID}::chat::create_chat_from_match`,
        arguments: [
          tx.object(matchId),
          tx.object("0x6"), // Clock
        ],
      });

      tx.transferObjects([chatRoom], tx.pure.address(account!.address));

      console.log('[useBlockchainMatch] Executing create_chat_from_match transaction...');

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            try {
              console.log('[useBlockchainMatch] Transaction successful, digest:', result.digest);
              
              const txResult = await client.waitForTransaction({
                digest: result.digest,
                options: { showObjectChanges: true },
              });

              console.log('[useBlockchainMatch] Transaction result:', {
                status: txResult.effects?.status,
                objectChanges: txResult.objectChanges?.length,
              });

              // Log all created objects for debugging
              const createdObjects = txResult.objectChanges?.filter((c: any) => c.type === "created");
              console.log('[useBlockchainMatch] Created objects:', createdObjects?.map((o: any) => ({
                type: o.objectType,
                id: 'objectId' in o ? o.objectId : 'unknown'
              })));

              const chatRoomObj = txResult.objectChanges?.find(
                (change: any) => change.type === "created" && change.objectType?.includes("::chat::ChatRoom")
              );

              const chatAllowlistObj = txResult.objectChanges?.find(
                (change: any) => change.type === "created" && change.objectType?.includes("::chat::ChatAllowlist")
              );

              if (!chatRoomObj || !("objectId" in chatRoomObj)) {
                console.error('[useBlockchainMatch] ChatRoom object not found in transaction result');
                throw new Error("ChatRoom object not found");
              }

              if (!chatAllowlistObj || !("objectId" in chatAllowlistObj)) {
                console.error('[useBlockchainMatch] ChatAllowlist object not found in transaction result');
                throw new Error("ChatAllowlist object not found");
              }

              console.log('[useBlockchainMatch] ✅ Chat objects found:', {
                chatRoomId: chatRoomObj.objectId,
                chatAllowlistId: chatAllowlistObj.objectId,
              });

              resolve({
                chatRoomId: chatRoomObj.objectId,
                chatAllowlistId: chatAllowlistObj.objectId,
              });
            } catch (error) {
              console.error('[useBlockchainMatch] Error processing transaction result:', error);
              reject(error);
            }
          },
          onError: (error) => {
            console.error('[useBlockchainMatch] Transaction failed:', error);
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
      console.log('[useBlockchainMatch] Saving chat room to database:', params);
      const response = await fetch('/api/save-chat-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[useBlockchainMatch] Failed to save chat room:', error);
        throw new Error(error.error || 'Failed to save chat room to database');
      }

      const result = await response.json();
      console.log('[useBlockchainMatch] Chat room saved successfully:', result);
    } catch (error) {
      console.error('[useBlockchainMatch] Error saving chat room:', error);
      // Don't throw - this is not critical, but log it
    }
  };

  return {
    createMatchOnChain,
    isCreatingMatch,
    canCreateMatch: !!account?.address,
  };
}
