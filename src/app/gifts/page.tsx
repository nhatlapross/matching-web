'use client';

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Gift, Coins, Calendar, User, MessageSquare, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { prisma } from '@/lib/prisma';

const GIFT_TYPES = [
  { value: 0, label: 'Virtual Rose', emoji: '🌹' },
  { value: 1, label: 'Diamond', emoji: '💎' },
  { value: 2, label: 'Chocolate Box', emoji: '🍫' },
  { value: 3, label: 'Star', emoji: '⭐' },
  { value: 4, label: 'Bouquet', emoji: '💐' },
  { value: 5, label: 'Mystery Gift', emoji: '🎁' },
];

interface ReceivedGift {
  id: string;
  giftType: string;
  giftEmoji: string;
  amount: number;
  message: string;
  sender: string;
  senderName?: string;
  senderImage?: string;
  timestamp: string;
  transactionDigest: string;
  isSuiTransfer: boolean;
}

export default function GiftsPage() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const router = useRouter();

  const [receivedGifts, setReceivedGifts] = useState<ReceivedGift[]>([]);
  const [sentGifts, setSentGifts] = useState<ReceivedGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    if (account?.address) {
      loadGifts();
    }
  }, [account?.address]);

  const loadGifts = async () => {
    if (!account?.address) return;

    try {
      setLoading(true);
      console.log('[Gifts] Loading gifts for:', account.address);

      // Load from localStorage (gifts received via notifications)
      const storedGifts = localStorage.getItem(`gifts_${account.address}`);
      let notificationGifts: ReceivedGift[] = [];
      
      if (storedGifts) {
        try {
          notificationGifts = JSON.parse(storedGifts);
        } catch (e) {
          console.error('[Gifts] Failed to parse stored gifts:', e);
        }
      }

      // Query owned DigitalGift objects (gifts received but not in notifications)
      try {
        const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
        if (PACKAGE_ID) {
          const ownedGifts = await client.getOwnedObjects({
            owner: account.address,
            filter: {
              StructType: `${PACKAGE_ID}::core::DigitalGift`,
            },
            options: {
              showContent: true,
              showType: true,
              showOwner: true,
              showPreviousTransaction: true,
            },
          });

          console.log('[Gifts] Found', ownedGifts.data.length, 'owned DigitalGift objects');

          // Query all transactions TO this address to find creation transactions
          const receivedTxs = await client.queryTransactionBlocks({
            filter: {
              ToAddress: account.address,
            },
            options: {
              showObjectChanges: true,
            },
            limit: 100, // Increase limit to find more gifts
          });

          // Build a map of objectId -> transaction digest
          const objectToTxMap = new Map<string, string>();
          for (const tx of receivedTxs.data) {
            const objectChanges = tx.objectChanges || [];
            for (const change of objectChanges) {
              const changeData = change as any;
              if (changeData.type === 'created' && changeData.objectId) {
                objectToTxMap.set(changeData.objectId, tx.digest);
              }
            }
          }

          console.log('[Gifts] Built objectId -> tx map with', objectToTxMap.size, 'entries');

          for (const obj of ownedGifts.data) {
            try {
              if (obj.data?.content && 'fields' in obj.data.content) {
                const fields = obj.data.content.fields as any;
                
                console.log('[Gifts] DigitalGift fields:', fields);
                
                // Check if already in notifications (by transaction digest or object id)
                const existingGift = notificationGifts.find(
                  g => g.id === obj.data!.objectId || g.transactionDigest === obj.data!.digest
                );

                if (!existingGift) {
                  const giftTypeMap: { [key: number]: { label: string; emoji: string } } = {
                    0: { label: 'Virtual Rose', emoji: '🌹' },
                    1: { label: 'Diamond', emoji: '💎' },
                    2: { label: 'Chocolate Box', emoji: '🍫' },
                    3: { label: 'Star', emoji: '⭐' },
                    4: { label: 'Bouquet', emoji: '💐' },
                    5: { label: 'Mystery Gift', emoji: '🎁' },
                  };

                  const giftInfo = giftTypeMap[fields.gift_type] || giftTypeMap[5];

                  // Parse timestamp correctly
                  let timestamp: string;
                  try {
                    const ts = fields.timestamp || fields.created_at || Date.now();
                    timestamp = new Date(Number(ts)).toISOString();
                  } catch (e) {
                    timestamp = new Date().toISOString();
                  }

                  // Get sender info - try to fetch from member data
                  let senderAddress = fields.sender || fields.from || 'Unknown';
                  let senderName = undefined;
                  let senderImage = undefined;

                  // Try to fetch sender info from database
                  try {
                    const response = await fetch(`/api/members/${senderAddress}`);
                    if (response.ok) {
                      const memberData = await response.json();
                      senderName = memberData.name;
                      senderImage = memberData.image;
                    }
                  } catch (e) {
                    console.log('[Gifts] Could not fetch sender info:', e);
                  }

                  // Get transaction digest from map
                  const txDigest = objectToTxMap.get(obj.data!.objectId) || obj.data?.previousTransaction || '';

                  const gift = {
                    id: obj.data!.objectId,
                    giftType: giftInfo.label,
                    giftEmoji: giftInfo.emoji,
                    amount: Number(fields.amount || 1),
                    message: fields.message || '',
                    sender: senderAddress,
                    senderName,
                    senderImage,
                    timestamp,
                    transactionDigest: txDigest,
                    isSuiTransfer: false,
                  };

                  console.log('[Gifts] ✅ Adding owned DigitalGift to received:', gift);
                  notificationGifts.push(gift);
                } else {
                  console.log('[Gifts] ⚠️ DigitalGift already exists in notifications');
                }
              }
            } catch (giftObjError) {
              console.error('[Gifts] Error processing DigitalGift object:', obj.data?.objectId, giftObjError);
            }
          }
        }
      } catch (giftError) {
        console.log('[Gifts] No DigitalGift objects found or not implemented:', giftError);
      }

      console.log('[Gifts] Total received gifts (notifications + owned):', notificationGifts.length);

      // Query SUI coin transfers (received)
      try {
        const txs = await client.queryTransactionBlocks({
          filter: {
            ToAddress: account.address,
          },
          options: {
            showInput: true,
            showEffects: true,
            showEvents: true,
          },
          limit: 50,
        });

        console.log('[Gifts] Found', txs.data.length, 'received transactions');

        // Filter for coin transfers (potential gifts)
        const coinTransfers: ReceivedGift[] = [];
        
        for (const tx of txs.data) {
          try {
            // Get full transaction details
            const fullTx = await client.getTransactionBlock({
              digest: tx.digest,
              options: {
                showBalanceChanges: true,
                showInput: true,
                showEffects: true,
              },
            });

            console.log('[Gifts] Transaction:', tx.digest, fullTx);

            // Check balance changes
            const balanceChanges = fullTx.balanceChanges || [];
            
            if (balanceChanges.length === 0) {
              continue;
            }

            // Find received coins
            const receivedCoins = balanceChanges.filter(
              (change: any) => {
                let owner = '';
                const ownerData = change.owner as any;
                if (typeof ownerData === 'string') {
                  owner = ownerData;
                } else if (ownerData?.AddressOwner) {
                  owner = ownerData.AddressOwner;
                } else if (ownerData?.ObjectOwner) {
                  owner = ownerData.ObjectOwner;
                }
                const amount = change.amount;
                return owner === account.address && BigInt(amount) > 0;
              }
            );

            if (receivedCoins.length > 0) {
              // Calculate total amount received
              const amount = receivedCoins.reduce(
                (sum: number, change: any) => {
                  const amt = Math.abs(Number(change.amount)) / 1_000_000_000;
                  return sum + amt;
                },
                0
              );

              // Find sender from balance changes
              const sentCoins = balanceChanges.filter(
                (change: any) => BigInt(change.amount) < 0
              );
              
              let sender = 'Unknown';
              if (sentCoins.length > 0) {
                const ownerData = sentCoins[0].owner as any;
                if (typeof ownerData === 'string') {
                  sender = ownerData;
                } else if (ownerData?.AddressOwner) {
                  sender = ownerData.AddressOwner;
                } else if (ownerData?.ObjectOwner) {
                  sender = ownerData.ObjectOwner;
                }
              }

              // Check if this gift is already in notifications
              const existingGift = notificationGifts.find(
                g => g.transactionDigest === tx.digest
              );

              if (!existingGift && sender !== account.address && sender !== 'Unknown' && amount > 0) {
                console.log('[Gifts] ✅ Found SUI transfer:', {
                  amount,
                  sender,
                  digest: tx.digest,
                });

                coinTransfers.push({
                  id: tx.digest,
                  giftType: 'SUI Transfer',
                  giftEmoji: '💰',
                  amount: amount,
                  message: 'Received SUI coins',
                  sender: sender,
                  timestamp: new Date(Number(fullTx.timestampMs || Date.now())).toISOString(),
                  transactionDigest: tx.digest,
                  isSuiTransfer: true,
                });
              }
            }
          } catch (txError) {
            console.error('[Gifts] Error processing transaction:', tx.digest, txError);
          }
        }

        console.log('[Gifts] Total coin transfers found:', coinTransfers.length);

        // Combine notification gifts and onchain transfers
        const allReceivedGifts = [...notificationGifts, ...coinTransfers];
        
        // Sort by timestamp (newest first)
        allReceivedGifts.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setReceivedGifts(allReceivedGifts);

        // Query sent gifts (transactions from this address)
        const sentTxs = await client.queryTransactionBlocks({
          filter: {
            FromAddress: account.address,
          },
          options: {
            showInput: true,
            showEffects: true,
            showEvents: true,
          },
          limit: 50,
        });

        console.log('[Gifts] Found', sentTxs.data.length, 'sent transactions');

        const sentTransfers: ReceivedGift[] = [];
        const sentDigitalGifts: ReceivedGift[] = [];
        
        for (const tx of sentTxs.data) {
          try {
            // Get full transaction details
            const fullTx = await client.getTransactionBlock({
              digest: tx.digest,
              options: {
                showBalanceChanges: true,
                showInput: true,
                showEffects: true,
                showObjectChanges: true,
              },
            });

            // Check if this transaction created a DigitalGift
            const objectChanges = fullTx.objectChanges || [];
            const createdGifts = objectChanges.filter(
              (change: any) => 
                change.type === 'created' && 
                change.objectType?.includes('::core::DigitalGift')
            );

            if (createdGifts.length > 0) {
              for (const giftChange of createdGifts) {
                try {
                  const change = giftChange as any;
                  
                  // Get the created gift object details
                  const giftObj = await client.getObject({
                    id: change.objectId,
                    options: {
                      showContent: true,
                      showType: true,
                    },
                  });

                  if (giftObj.data?.content && 'fields' in giftObj.data.content) {
                    const fields = giftObj.data.content.fields as any;
                    
                    const giftTypeMap: { [key: number]: { label: string; emoji: string } } = {
                      0: { label: 'Virtual Rose', emoji: '🌹' },
                      1: { label: 'Diamond', emoji: '💎' },
                      2: { label: 'Chocolate Box', emoji: '🍫' },
                      3: { label: 'Star', emoji: '⭐' },
                      4: { label: 'Bouquet', emoji: '💐' },
                      5: { label: 'Mystery Gift', emoji: '🎁' },
                    };

                    const giftInfo = giftTypeMap[fields.gift_type] || giftTypeMap[5];
                    
                    // Get recipient from owner or fields
                    let recipient = 'Unknown';
                    if (fields.recipient) {
                      recipient = fields.recipient;
                    } else if (change.owner?.AddressOwner) {
                      recipient = change.owner.AddressOwner;
                    }

                    console.log('[Gifts] ✅ Found sent DigitalGift:', {
                      type: giftInfo.label,
                      recipient,
                      digest: tx.digest,
                    });

                    sentDigitalGifts.push({
                      id: giftObj.data.objectId,
                      giftType: giftInfo.label,
                      giftEmoji: giftInfo.emoji,
                      amount: Number(fields.amount || 1),
                      message: fields.message || '',
                      sender: recipient, // Store recipient in sender field for display
                      timestamp: new Date(Number(fullTx.timestampMs || Date.now())).toISOString(),
                      transactionDigest: tx.digest,
                      isSuiTransfer: false,
                    });
                  }
                } catch (giftObjError) {
                  console.error('[Gifts] Error fetching sent gift object:', giftObjError);
                }
              }
              continue; // Skip balance change check for gift transactions
            }

            const balanceChanges = fullTx.balanceChanges || [];
            
            if (balanceChanges.length === 0) {
              continue;
            }

            // Find coins sent from this address
            const sentCoins = balanceChanges.filter(
              (change: any) => {
                let owner = '';
                const ownerData = change.owner as any;
                if (typeof ownerData === 'string') {
                  owner = ownerData;
                } else if (ownerData?.AddressOwner) {
                  owner = ownerData.AddressOwner;
                } else if (ownerData?.ObjectOwner) {
                  owner = ownerData.ObjectOwner;
                }
                const amount = change.amount;
                return owner === account.address && BigInt(amount) < 0;
              }
            );

            if (sentCoins.length > 0) {
              const amount = sentCoins.reduce(
                (sum: number, change: any) => sum + Math.abs(Number(change.amount)) / 1_000_000_000,
                0
              );

              // Find recipient
              const receivedCoins = balanceChanges.filter(
                (change: any) => BigInt(change.amount) > 0
              );
              
              let recipient = 'Unknown';
              if (receivedCoins.length > 0) {
                const ownerData = receivedCoins[0].owner as any;
                if (typeof ownerData === 'string') {
                  recipient = ownerData;
                } else if (ownerData?.AddressOwner) {
                  recipient = ownerData.AddressOwner;
                } else if (ownerData?.ObjectOwner) {
                  recipient = ownerData.ObjectOwner;
                }
              }

              if (recipient !== account.address && recipient !== 'Unknown' && amount > 0) {
                console.log('[Gifts] ✅ Found sent SUI transfer:', {
                  amount,
                  recipient,
                  digest: tx.digest,
                });

                sentTransfers.push({
                  id: tx.digest,
                  giftType: 'SUI Transfer',
                  giftEmoji: '💰',
                  amount: amount,
                  message: 'Sent SUI coins',
                  sender: recipient, // Store recipient in sender field for display
                  timestamp: new Date(Number(fullTx.timestampMs || Date.now())).toISOString(),
                  transactionDigest: tx.digest,
                  isSuiTransfer: true,
                });
              }
            }
          } catch (txError) {
            console.error('[Gifts] Error processing sent transaction:', tx.digest, txError);
          }
        }

        console.log('[Gifts] Total sent SUI transfers found:', sentTransfers.length);
        console.log('[Gifts] Total sent DigitalGifts found:', sentDigitalGifts.length);

        // Combine sent transfers and digital gifts
        const allSentGifts = [...sentDigitalGifts, ...sentTransfers];

        allSentGifts.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setSentGifts(allSentGifts);
      } catch (txError) {
        console.error('[Gifts] Error querying transactions:', txError);
        // Fallback to notification gifts only
        setReceivedGifts(notificationGifts);
      }
    } catch (error) {
      console.error('[Gifts] Error loading gifts:', error);
      toast.error('Failed to load gifts');
    } finally {
      setLoading(false);
    }
  };

  const viewTransaction = (digest: string) => {
    const explorerUrl = `https://suiscan.xyz/testnet/tx/${digest}`;
    window.open(explorerUrl, '_blank');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGifts();
    setRefreshing(false);
    toast.success('Gifts refreshed!');
  };

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <Gift className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600">
              Please connect your wallet to view your received gifts
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Gift className="w-8 h-8 text-pink-500" />
              My Gifts
            </h1>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {refreshing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </>
              )}
            </Button>
          </div>
          <p className="text-gray-600 mb-4">
            View gifts you've received and sent on the blockchain
          </p>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Received</p>
                    <p className="text-2xl font-bold text-green-700">
                      {receivedGifts.filter(g => g.isSuiTransfer).reduce((sum, g) => sum + g.amount, 0).toFixed(2)} SUI
                    </p>
                  </div>
                  <Gift className="w-10 h-10 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Sent</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {sentGifts.filter(g => g.isSuiTransfer).reduce((sum, g) => sum + g.amount, 0).toFixed(2)} SUI
                    </p>
                  </div>
                  <Coins className="w-10 h-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Virtual Gifts</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {receivedGifts.filter(g => !g.isSuiTransfer).length}
                    </p>
                  </div>
                  <Gift className="w-10 h-10 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'received'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Received ({receivedGifts.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'sent'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sent ({sentGifts.length})
          </button>
        </div>

        {(activeTab === 'received' ? receivedGifts : sentGifts).length === 0 ? (
          <div className="text-center p-12 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border-2 border-dashed border-purple-200">
            <Gift className="w-16 h-16 mx-auto mb-4 text-purple-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {activeTab === 'received' ? 'No Gifts Received' : 'No Gifts Sent'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'received' 
                ? 'When someone sends you a gift, it will appear here'
                : 'Gifts you send to others will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const gifts = activeTab === 'received' ? receivedGifts : sentGifts;
              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">
                      {gifts.length} gift{gifts.length > 1 ? 's' : ''} {activeTab}
                    </p>
                    <p className="text-sm text-gray-600">
                      {gifts.filter(g => g.isSuiTransfer).length} SUI transfers
                    </p>
                  </div>

                  {gifts.map(gift => {
              return (
                <Card
                  key={gift.id}
                  className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-5xl">{gift.giftEmoji}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold">
                              {gift.giftType}
                            </h3>
                            {gift.isSuiTransfer && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded flex items-center gap-1">
                                <Coins className="w-3 h-3" />
                                {gift.amount} SUI
                              </span>
                            )}
                            {!gift.isSuiTransfer && gift.amount > 1 && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded">
                                x{gift.amount}
                              </span>
                            )}
                          </div>

                          {gift.message && (
                            <div className="flex items-start gap-2 mb-3 p-3 bg-white rounded-lg">
                              <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-700 italic">
                                "{gift.message}"
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              {gift.senderImage && (
                                <img
                                  src={gift.senderImage}
                                  alt={gift.senderName || 'Sender'}
                                  className="w-6 h-6 rounded-full"
                                />
                              )}
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>
                                  {activeTab === 'received' 
                                    ? `From: ${gift.senderName || `${gift.sender.slice(0, 6)}...${gift.sender.slice(-4)}`}`
                                    : `To: ${gift.sender.slice(0, 6)}...${gift.sender.slice(-4)}`
                                  }
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(gift.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => viewTransaction(gift.transactionDigest)}
                          variant="outline"
                          size="sm"
                          className="text-purple-600 border-purple-300 hover:bg-purple-50"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View TX
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
