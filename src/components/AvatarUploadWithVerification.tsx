"use client";

import React, { useState, useRef } from 'react';
import { Button, Image, Checkbox } from '@nextui-org/react';
import { Upload, X, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { extractFaceDescriptor } from '@/utils/faceVerification';

interface AvatarUploadWithVerificationProps {
  onFileSelect: (file: File, faceSwapped: boolean) => void;
  currentPreview?: string | null;
  onRemove?: () => void;
  referenceFaceDescriptor: any; // Face descriptor from liveness check
}

export default function AvatarUploadWithVerification({
  onFileSelect,
  currentPreview,
  onRemove,
  referenceFaceDescriptor,
}: AvatarUploadWithVerificationProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [enableFaceSwap, setEnableFaceSwap] = useState(true);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [swappedPreview, setSwappedPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must not exceed 5MB');
      return false;
    }

    return true;
  };

  const verifyFaceMatch = async (file: File): Promise<boolean> => {
    try {
      const url = URL.createObjectURL(file);
      const descriptor = await extractFaceDescriptor(url);

      if (!descriptor) {
        toast.error('No face detected in image. Please choose another image.');
        return false;
      }

      // Compare with reference face
      const faceapi = await import('face-api.js');
      const distance = faceapi.euclideanDistance(
        referenceFaceDescriptor.descriptor,
        descriptor.descriptor
      );

      const similarityScore = Math.round((1 - distance) * 100);

      if (distance >= 0.55) {
        toast.error(
          `Face doesn't match reference face (match: ${similarityScore}%). Please use your own photo.`
        );
        return false;
      }

      toast.success(`✅ Face verified (match: ${similarityScore}%)`);
      return true;
    } catch (error) {
      console.error('Face verification error:', error);
      toast.error('Error verifying face. Please try again.');
      return false;
    }
  };

  const performFaceSwap = async (file: File): Promise<string | null> => {
    try {
      setIsSwapping(true);
      const faceapi = await import('face-api.js');

      // Load models if needed
      if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
      }

      // Get random face
      const { getRandomFaceUrl } = await import('@/utils/randomFace');
      const randomFaceUrl = getRandomFaceUrl();

      // Load images
      const [sourceImage, targetImage] = await Promise.all([
        loadImageFromUrl(randomFaceUrl),
        loadImageFromFile(file),
      ]);

      // Detect face in target
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('Canvas context error');

      tempCanvas.width = targetImage.naturalWidth || targetImage.width;
      tempCanvas.height = targetImage.naturalHeight || targetImage.height;
      tempCtx.drawImage(targetImage, 0, 0, tempCanvas.width, tempCanvas.height);

      const targetDetections = await faceapi.detectSingleFace(tempCanvas).withFaceLandmarks();

      if (!targetDetections) {
        throw new Error('No face detected for swap');
      }

      // Perform face swap
      const { swapFacesWithBlending } = await import('@/utils/faceSwapUtils');

      const targetBox = targetDetections.detection.box;
      const sourceBox = {
        x: 0,
        y: 0,
        width: sourceImage.width,
        height: sourceImage.height,
      };

      const resultCanvas = swapFacesWithBlending(
        sourceImage,
        targetImage,
        sourceBox,
        {
          x: targetBox.x,
          y: targetBox.y,
          width: targetBox.width,
          height: targetBox.height,
        },
        true
      );

      // Convert to data URL
      return resultCanvas.toDataURL('image/png');
    } catch (error) {
      console.error('Face swap error:', error);
      toast.error('Face swap failed. Using original image.');
      return null;
    } finally {
      setIsSwapping(false);
    }
  };

  const loadImageFromUrl = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  };

  const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return;

    setIsVerifying(true);

    // Verify face matches reference
    const isValid = await verifyFaceMatch(file);
    setIsVerifying(false);

    if (!isValid) return;

    setOriginalFile(file);

    // Perform face swap if enabled
    if (enableFaceSwap) {
      const swapped = await performFaceSwap(file);
      if (swapped) {
        setSwappedPreview(swapped);
      }
    }

    onFileSelect(file, enableFaceSwap);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith('image/'));

    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      toast.error('Please select an image file');
    }
  };

  const handleRemove = () => {
    setOriginalFile(null);
    setSwappedPreview(null);
    if (onRemove) onRemove();
  };

  const displayPreview = swappedPreview || currentPreview;

  return (
    <div className="space-y-4">
      {displayPreview ? (
        <div className="space-y-3">
          <div className="relative inline-block">
            <Image
              src={displayPreview}
              alt="Avatar Preview"
              className="w-32 h-32 rounded-full object-cover"
            />
            <Button
              isIconOnly
              size="sm"
              color="danger"
              className="absolute -top-2 -right-2"
              onPress={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {swappedPreview && (
            <p className="text-xs text-success">
              ✅ Face swapped for privacy
            </p>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isVerifying && !isSwapping && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragOver ? 'border-primary bg-primary/5' : 'border-default-300 hover:border-primary'}
            ${(isVerifying || isSwapping) ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
            disabled={isVerifying || isSwapping}
          />
          {isVerifying ? (
            <>
              <Loader2 className="h-12 w-12 mx-auto mb-2 text-primary animate-spin" />
              <p className="text-sm font-medium">Verifying face...</p>
            </>
          ) : isSwapping ? (
            <>
              <RefreshCw className="h-12 w-12 mx-auto mb-2 text-primary animate-spin" />
              <p className="text-sm font-medium">Swapping face...</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto mb-2 text-default-400" />
              <p className="text-sm font-medium">Drag & drop or click to select</p>
              <p className="text-xs text-default-500 mt-1">
                Supports JPG, PNG, WebP (max 5MB)
              </p>
            </>
          )}
        </div>
      )}

      {/* Face swap option */}
      <Checkbox
        isSelected={enableFaceSwap}
        onValueChange={setEnableFaceSwap}
        size="sm"
      >
        <span className="text-xs">Enable face swap for privacy</span>
      </Checkbox>
    </div>
  );
}
