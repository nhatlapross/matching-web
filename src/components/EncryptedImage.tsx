"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EncryptedImageProps {
  encryptedUrl?: string | null;
  publicUrl?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onDecryptError?: (error: Error) => void;
}

export default function EncryptedImage({
  encryptedUrl,
  publicUrl,
  alt,
  className = '',
  width = 300,
  height = 300,
  onDecryptError,
}: EncryptedImageProps) {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no encrypted URL, use public URL directly
    if (!encryptedUrl) {
      setDecryptedUrl(publicUrl || '/images/user.png');
      return;
    }

    // Start decryption process
    setIsDecrypting(true);
    decryptImage(encryptedUrl);
  }, [encryptedUrl, publicUrl]);

  const decryptImage = async (url: string) => {
    try {
      // TODO: Implement actual Seal decryption here
      // For now, simulate decryption attempt
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try to fetch the encrypted image
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch encrypted image');
      }

      // Check if user has access (this should be handled by backend)
      // If backend returns 403, it means no access
      if (response.status === 403) {
        throw new Error('NO_ACCESS');
      }

      // For now, just use the URL directly
      // In production, this would decrypt the blob
      setDecryptedUrl(url);
      setIsDecrypting(false);
    } catch (err: any) {
      console.error('[EncryptedImage] Decryption failed:', err);
      
      if (err.message === 'NO_ACCESS') {
        setError('You do not have permission to view this image');
      } else {
        setError('Failed to decrypt image');
      }
      
      setIsDecrypting(false);
      
      if (onDecryptError) {
        onDecryptError(err);
      }
    }
  };

  // Show skeleton while decrypting
  if (isDecrypting) {
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        <Skeleton className="w-full h-full rounded-2xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Lock className="h-6 w-6 animate-pulse" />
            <span className="text-xs">Decrypting...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error if decryption failed
  if (error) {
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        <div className="w-full h-full rounded-2xl bg-muted flex items-center justify-center p-4">
          <Alert variant="destructive" className="border-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Show decrypted image
  return (
    <div className={`relative ${className}`}>
      <Image
        src={decryptedUrl || '/images/user.png'}
        alt={alt}
        width={width}
        height={height}
        className="rounded-2xl object-cover"
        onError={() => {
          setError('Failed to load image');
        }}
      />
    </div>
  );
}
