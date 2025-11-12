/**
 * Script to check match status on blockchain
 * Run with: npx tsx scripts/check-match-status.ts <matchId>
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

async function checkMatchStatus(matchId: string) {
  const network = (process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet';
  const client = new SuiClient({ url: getFullnodeUrl(network) });

  console.log('Checking match status for:', matchId);
  console.log('Network:', network);
  console.log('');

  try {
    const matchObj = await client.getObject({
      id: matchId,
      options: {
        showContent: true,
        showType: true,
        showOwner: true,
      }
    });

    if (!matchObj.data) {
      console.log('❌ Match not found');
      return;
    }

    console.log('Match Object:');
    console.log('  Type:', matchObj.data.type);
    console.log('  Owner:', matchObj.data.owner);
    console.log('');

    if (matchObj.data.content && 'fields' in matchObj.data.content) {
      const fields = matchObj.data.content.fields as any;
      console.log('Match Fields:');
      console.log('  User A:', fields.user_a);
      console.log('  User B:', fields.user_b);
      console.log('  Status:', fields.status);
      console.log('  Compatibility Score:', fields.compatibility_score);
      console.log('  Created At:', new Date(parseInt(fields.created_at)).toISOString());
      console.log('  Mutual:', fields.mutual);
      console.log('');

      const status = parseInt(fields.status);
      console.log('Status Interpretation:');
      if (status === 0) {
        console.log('  ⏳ PENDING (0) - Match request created, waiting for response');
      } else if (status === 1) {
        console.log('  ✅ ACTIVE (1) - Match is active, can create chat');
      } else if (status === 2) {
        console.log('  ❌ REJECTED (2) - Match was rejected');
      } else if (status === 3) {
        console.log('  🚫 BLOCKED (3) - Match is blocked');
      } else {
        console.log('  ❓ UNKNOWN (' + status + ')');
      }
      console.log('');

      if (status !== 1) {
        console.log('⚠️  Match is not ACTIVE - cannot create chat room');
        console.log('   Need to activate match first by calling update_match_status(matchId, 1)');
      } else {
        console.log('✅ Match is ACTIVE - can create chat room');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

const matchId = process.argv[2];
if (!matchId) {
  console.log('Usage: npx tsx scripts/check-match-status.ts <matchId>');
  process.exit(1);
}

checkMatchStatus(matchId);
