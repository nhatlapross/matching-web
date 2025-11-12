"use client";

import { useEffect } from 'react';
import { pusherClient } from '@/lib/pusher';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface GiftNotificationListenerProps {
  userId: string;
}

export default function GiftNotificationListener({ userId }: GiftNotificationListenerProps) {
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    console.log('[GiftNotification] Subscribing to gift notifications for:', userId);
    const channel = pusherClient.subscribe(`private-${userId}`);

    // Listen for received gifts
    channel.bind('gift:received', (data: {
      senderId: string;
      senderName: string;
      senderImage?: string;
      giftType: string;
      giftEmoji: string;
      amount: number;
      message: string;
      transactionDigest: string;
      isSuiTransfer?: boolean;
      timestamp: string;
    }) => {
      console.log('[GiftNotification] Gift received:', data);

      // Save gift to localStorage
      try {
        const storageKey = `gifts_${userId}`;
        const storedGifts = localStorage.getItem(storageKey);
        const gifts = storedGifts ? JSON.parse(storedGifts) : [];
        
        // Add new gift
        gifts.unshift({
          id: data.transactionDigest,
          giftType: data.giftType,
          giftEmoji: data.giftEmoji,
          amount: data.amount,
          message: data.message,
          sender: data.senderId,
          senderName: data.senderName,
          senderImage: data.senderImage,
          timestamp: data.timestamp,
          transactionDigest: data.transactionDigest,
          isSuiTransfer: data.isSuiTransfer || false,
        });
        
        // Keep only last 100 gifts
        if (gifts.length > 100) {
          gifts.splice(100);
        }
        
        localStorage.setItem(storageKey, JSON.stringify(gifts));
      } catch (e) {
        console.error('[GiftNotification] Failed to save gift:', e);
      }

      const amountText = data.amount > 1 ? ` x${data.amount}` : '';
      const giftText = data.isSuiTransfer 
        ? `${data.amount} SUI` 
        : `${data.giftEmoji} ${data.giftType}${amountText}`;

      // Show toast notification
      toast.success(
        <div className="flex flex-col gap-1">
          <div className="font-semibold">
            🎁 Gift Received from {data.senderName}!
          </div>
          <div className="text-sm">
            {giftText}
          </div>
          {data.message && (
            <div className="text-xs text-gray-600 dark:text-gray-400 italic">
              "{data.message}"
            </div>
          )}
        </div>,
        {
          position: 'top-right',
          autoClose: 5000,
          onClick: () => {
            // Navigate to gifts page
            router.push('/gifts');
          },
          style: { cursor: 'pointer' }
        }
      );

      // Play notification sound (optional)
      try {
        const audio = new Audio('/sounds/gift-received.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Could not play sound:', e));
      } catch (e) {
        // Ignore sound errors
      }
    });

    // Listen for sent gift confirmations
    channel.bind('gift:sent', (data: {
      recipientId: string;
      giftType: string;
      giftEmoji: string;
      amount: number;
      message: string;
      transactionDigest: string;
      isSuiTransfer?: boolean;
      timestamp: string;
    }) => {
      console.log('[GiftNotification] Gift sent confirmation:', data);

      const amountText = data.amount > 1 ? ` x${data.amount}` : '';
      const giftText = data.isSuiTransfer 
        ? `${data.amount} SUI` 
        : `${data.giftEmoji} ${data.giftType}${amountText}`;

      // Show subtle confirmation toast
      toast.info(
        <div className="flex flex-col gap-1">
          <div className="font-semibold">
            ✅ Gift Sent Successfully!
          </div>
          <div className="text-sm">
            {giftText}
          </div>
        </div>,
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );
    });

    return () => {
      console.log('[GiftNotification] Unsubscribing from gift notifications');
      channel.unbind('gift:received');
      channel.unbind('gift:sent');
      pusherClient.unsubscribe(`private-${userId}`);
    };
  }, [userId, router]);

  return null; // This is a listener component, no UI
}
