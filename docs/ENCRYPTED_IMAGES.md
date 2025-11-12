# Encrypted Images với Skeleton Loading

## Tổng quan

Component `EncryptedImage` hiển thị encrypted photos với:
- Skeleton loading animation khi đang decrypt
- Error message nếu không có quyền xem
- Tự động fallback về public image nếu không encrypted

## Sử dụng

### Basic Usage

```tsx
import EncryptedImage from '@/components/EncryptedImage';

<EncryptedImage
  encryptedUrl={photo.encryptedUrl}
  publicUrl={photo.url}
  alt="Member photo"
  width={300}
  height={300}
/>
```

### Với MemberImage

```tsx
import MemberImage from '@/components/MemberImage';

<MemberImage
  photo={photo}
  isEncrypted={true}  // Enable encryption handling
/>
```

## States

### 1. Loading State (Decrypting)
```
┌─────────────────────┐
│                     │
│    🔒 (animated)    │
│    Decrypting...    │
│                     │
└─────────────────────┘
```
- Hiển thị skeleton với animation
- Icon lock pulse
- Text "Decrypting..."

### 2. Error State (No Permission)
```
┌─────────────────────┐
│  ⚠️                  │
│  You do not have    │
│  permission to view │
│  this image         │
└─────────────────────┘
```
- Background muted
- Alert destructive variant
- Clear error message in English

### 3. Success State
- Hiển thị decrypted image
- Normal image display

## Error Messages

### No Access
```
"You do not have permission to view this image"
```
- Khi backend trả về 403
- User không có quyền xem (chưa match)

### Decryption Failed
```
"Failed to decrypt image"
```
- Khi có lỗi technical
- Network error, invalid data, etc.

### Load Failed
```
"Failed to load image"
```
- Khi image URL không valid
- Image không tồn tại

## Props

```typescript
interface EncryptedImageProps {
  encryptedUrl?: string | null;     // URL của encrypted image
  publicUrl?: string | null;         // Fallback public URL
  alt: string;                       // Alt text
  className?: string;                // Custom CSS classes
  width?: number;                    // Width (default: 300)
  height?: number;                   // Height (default: 300)
  onDecryptError?: (error: Error) => void;  // Error callback
}
```

## Integration với Seal Protocol

Hiện tại component đang simulate decryption. Để integrate với Seal:

```typescript
const decryptImage = async (url: string) => {
  try {
    // 1. Fetch encrypted blob
    const response = await fetch(url);
    const encryptedBlob = await response.blob();

    // 2. Initialize Seal client
    const sealClient = new SealClient({
      suiClient: client,
      serverConfigs: SEAL_SERVERS,
    });

    // 3. Decrypt blob
    const decryptedData = await sealClient.decrypt({
      encryptedObject: new Uint8Array(await encryptedBlob.arrayBuffer()),
      id: encryptionId,
    });

    // 4. Create object URL
    const blob = new Blob([decryptedData]);
    const objectUrl = URL.createObjectURL(blob);
    
    setDecryptedUrl(objectUrl);
    setIsDecrypting(false);
  } catch (err) {
    // Handle errors...
  }
};
```

## Flow

```
1. Component mounts
2. Check if encryptedUrl exists
3. If yes:
   a. Show skeleton loading
   b. Start decryption
   c. On success: show image
   d. On error: show error message
4. If no:
   a. Use publicUrl directly
```

## Styling

Component sử dụng Tailwind classes:
- `animate-pulse` - Skeleton animation
- `rounded-2xl` - Rounded corners
- `bg-muted` - Background color
- `object-cover` - Image fit

## Examples

### Photo Gallery
```tsx
<div className="grid grid-cols-3 gap-4">
  {photos.map(photo => (
    <EncryptedImage
      key={photo.id}
      encryptedUrl={photo.encryptedUrl}
      publicUrl={photo.url}
      alt={`Photo ${photo.id}`}
      width={200}
      height={200}
    />
  ))}
</div>
```

### Profile Avatar
```tsx
<EncryptedImage
  encryptedUrl={user.privateAvatarUrl}
  publicUrl={user.publicAvatarUrl}
  alt={user.name}
  width={100}
  height={100}
  className="rounded-full"
/>
```

## Testing

### Test No Access
```typescript
// Mock fetch to return 403
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: false,
    status: 403,
  })
);

// Should show "You do not have permission to view this image"
```

### Test Decryption Success
```typescript
// Mock successful decryption
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    blob: () => Promise.resolve(new Blob()),
  })
);

// Should show decrypted image
```

## Notes

- Skeleton hiển thị trong 1 giây (simulate)
- Error messages luôn bằng tiếng Anh
- Component tự động cleanup object URLs
- Fallback về public image nếu không có encrypted URL
