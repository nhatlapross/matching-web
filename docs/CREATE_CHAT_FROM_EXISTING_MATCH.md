# Tạo Chat Room từ Match On-chain Đã Có

## Tổng quan

Nếu bạn đã có match on-chain nhưng chưa có chat room (encrypted chat), bạn có thể tạo chat room từ match đã tồn tại mà không cần tạo lại match.

## Cách sử dụng

### 1. Từ Chat Page (Tự động)

Khi bạn vào trang chat với người đã match:
- Nếu có mutual match nhưng chưa có chat room
- Sẽ hiển thị banner với button **"Create Encrypted Chat"**
- Click button để tạo chat room

```
🔒 You have a match! Create an encrypted chat room on blockchain for secure messaging.
[Create Encrypted Chat with UserName]
```

### 2. Sử dụng Hook trong Component

```typescript
import { useBlockchainChat } from '@/hooks/useBlockchainChat';

function MyComponent() {
  const { createChatFromExistingMatch, isCreatingChat, canCreateChat } = useBlockchainChat();

  const handleCreateChat = async () => {
    const success = await createChatFromExistingMatch({
      targetUserAddress: '0x...',
    });

    if (success) {
      // Chat room created successfully
      router.refresh();
    }
  };

  return (
    <button 
      onClick={handleCreateChat}
      disabled={isCreatingChat || !canCreateChat}
    >
      {isCreatingChat ? 'Creating...' : 'Create Chat'}
    </button>
  );
}
```

### 3. Sử dụng Component Button

```typescript
import CreateChatRoomButton from '@/components/CreateChatRoomButton';

function MyComponent() {
  return (
    <CreateChatRoomButton
      targetUserAddress="0x..."
      targetUserName="John Doe"
      variant="default"
      size="sm"
    />
  );
}
```

## Kiểm tra Matches Cần Chat Room

Chạy script để xem các matches đã có nhưng chưa có chat room:

```bash
npx tsx scripts/create-chat-for-existing-matches.ts
```

Script sẽ hiển thị:
- Tổng số mutual matches
- Số matches đã có chat room
- Số matches chưa có chat room
- Chi tiết từng match (wallet address, profileId, matchId)
- Có thể tạo chat không (dựa vào data có đủ không)

## Flow Hoạt Động

```
1. User vào chat page với matched user
2. System check: có mutual match? có chat room?
3. Nếu có match nhưng chưa có chat room → hiển thị button
4. User click "Create Encrypted Chat"
5. useBlockchainChat.createChatFromExistingMatch():
   a. Tìm matchId on-chain giữa 2 users
   b. Gọi contract: chat::create_chat_from_match(matchId)
   c. Lấy chatRoomId và chatAllowlistId từ transaction result
   d. Save vào database qua API /api/save-chat-room
6. Page refresh → chat form chuyển sang ChatFormWithBlockchain
7. Messages được encrypt với Seal Protocol
```

## Yêu cầu

Để tạo chat room từ match đã có, cần:

1. ✅ **Mutual match tồn tại** (matchStatus = 1 trong database)
2. ✅ **Match on-chain tồn tại** (có matchId)
3. ✅ **Wallet connected** (để sign transaction)
4. ✅ **Cả 2 users có profileObjectId** (on-chain profile)

## Xử lý Lỗi

### "No on-chain match found"
- Match chưa được tạo on-chain
- Cần tạo match on-chain trước (qua game completion)

### "Chat room already exists"
- Chat room đã tồn tại on-chain
- System sẽ tự động fetch và sử dụng chat room hiện có

### "Please connect your wallet first"
- Wallet chưa connect
- Connect wallet trước khi tạo chat

### "Failed to create chat room"
- Transaction failed
- Check console logs để xem chi tiết lỗi
- Có thể do gas không đủ hoặc contract error

## Database Schema

```prisma
model ChatRoom {
  id              String   @id @default(cuid())
  chatRoomId      String   @unique // On-chain chat room object ID
  chatAllowlistId String   // On-chain chat allowlist object ID
  participant1    String   // User ID or wallet address
  participant2    String   // User ID or wallet address
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([participant1, participant2])
  @@index([chatRoomId])
}
```

## API Endpoint

**POST /api/save-chat-room**

Request:
```json
{
  "chatRoomId": "0x...",
  "chatAllowlistId": "0x...",
  "currentUserId": "0x...",
  "targetUserId": "0x..."
}
```

Response:
```json
{
  "success": true,
  "chatRoom": {
    "id": "...",
    "chatRoomId": "0x...",
    "chatAllowlistId": "0x...",
    "participant1": "0x...",
    "participant2": "0x..."
  }
}
```

## Logs để Debug

Khi tạo chat room, check console logs:

```
[useBlockchainChat] Creating chat from existing match: {...}
[useBlockchainChat] Step 1: Finding existing match...
[useBlockchainChat] ✅ Found existing match: 0x...
[useBlockchainChat] Step 2: Creating chat room from match...
[useBlockchainChat] Creating chat from match: 0x...
[useBlockchainChat] Executing create_chat_from_match transaction...
[useBlockchainChat] Transaction successful, digest: ...
[useBlockchainChat] Created objects: [...]
[useBlockchainChat] ✅ Chat objects found: {...}
[useBlockchainChat] ✅ Chat room created: {...}
[useBlockchainChat] Step 3: Saving chat room to database...
[useBlockchainChat] Saving chat room to database: {...}
[useBlockchainChat] Chat room saved successfully: {...}
[useBlockchainChat] ✅ All steps completed successfully!
```

## Lưu ý

- Chat room chỉ có thể tạo 1 lần cho mỗi match
- Nếu đã có chat room, không thể tạo lại
- Messages trong chat room được encrypt bằng Seal Protocol
- Chỉ 2 matched users mới có thể đọc messages
