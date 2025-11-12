"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Loader2, AlertTriangle, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';
import { validateAvatarFile } from '@/lib/utils/avatarUtils';

// Face detection validation function
const validateFaceInImage = async (imageUrl: string): Promise<boolean> => {
  try {
    const faceapi = await import('face-api.js');
    
    if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve) => {
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(false);
            return;
          }

          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const detection = await faceapi.detectSingleFace(canvas).withFaceLandmarks();
          resolve(!!detection);
        } catch (error) {
          console.error('Face detection error:', error);
          resolve(false);
        }
      };
      
      img.onerror = () => resolve(false);
      img.src = imageUrl;
    });
  } catch (error) {
    console.error('Face validation setup error:', error);
    return false;
  }
};

interface PhotoUploadWithVerificationProps {
  onUploadSuccess: (file: File) => Promise<void>;
}

export default function PhotoUploadWithVerification({
  onUploadSuccess
}: PhotoUploadWithVerificationProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isValidatingFace, setIsValidatingFace] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [referenceFaceDescriptor, setReferenceFaceDescriptor] = useState<any>(null);
  const [faceVerificationEnabled, setFaceVerificationEnabled] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load reference face for verification
  React.useEffect(() => {
    const loadReferenceFace = async () => {
      try {
        const response = await fetch('/api/member/reference-face');
        if (response.ok) {
          const data = await response.json();
          if (data.referenceFaceLandmarks) {
            const descriptorArray = JSON.parse(data.referenceFaceLandmarks);
            setReferenceFaceDescriptor({
              descriptor: new Float32Array(descriptorArray)
            });
            setFaceVerificationEnabled(data.faceVerificationEnabled);
          }
        }
      } catch (error) {
        console.error('Failed to load reference face:', error);
      }
    };
    
    loadReferenceFace();
  }, []);

  // Handle file selection with face verification
  const handleFileSelect = async (file: File) => {
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    setVerificationError(null);
    setIsValidatingFace(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      
      try {
        console.log('🔍 Starting face validation...');
        const hasValidFace = await validateFaceInImage(imageUrl);
        
        if (!hasValidFace) {
          console.log('❌ No face detected');
          const errorMsg = 'No face detected in image. Please choose a clear photo with your face visible.';
          setVerificationError(errorMsg);
          setIsValidatingFace(false);
          toast.error(`❌ ${errorMsg}`);
          return;
        }

        console.log('✅ Face detected, checking against reference...');

        // Verify face matches reference if enabled
        if (faceVerificationEnabled && referenceFaceDescriptor) {
          const { extractFaceDescriptor } = await import('@/utils/faceVerification');
          const uploadedDescriptor = await extractFaceDescriptor(imageUrl);

          if (!uploadedDescriptor) {
            console.log('❌ Cannot extract face descriptor');
            const errorMsg = 'Cannot extract face features from this image. Please choose a clearer photo.';
            setVerificationError(errorMsg);
            setIsValidatingFace(false);
            toast.error(`❌ ${errorMsg}`);
            return;
          }

          const faceapi = await import('face-api.js');
          const distance = faceapi.euclideanDistance(
            referenceFaceDescriptor.descriptor,
            uploadedDescriptor.descriptor
          );

          const similarityScore = Math.round((1 - distance) * 100);
          console.log(`📊 Face comparison: distance=${distance.toFixed(3)}, similarity=${similarityScore}%`);

          if (distance >= 0.55) {
            console.log('❌ Face verification FAILED - different person');
            const errorMsg = `This photo doesn't match your reference face (similarity: ${similarityScore}%). Please use your own photo, not someone else's.`;
            setVerificationError(errorMsg);
            setIsValidatingFace(false);
            toast.error(`❌ ${errorMsg}`, { autoClose: 5000 });
            return;
          }

          console.log('✅ Face verification PASSED');
          toast.success(`✅ Face verified (similarity: ${similarityScore}%)`);
        } else {
          toast.success('✅ Face detected in image!');
        }
        
        // All checks passed
        console.log('✅ All checks passed - ready to upload');
        setVerificationError(null);
        setPreview(imageUrl);
        setSelectedFile(file);
        setIsValidatingFace(false);
        
      } catch (error) {
        console.error('❌ Face validation error:', error);
        const errorMsg = 'Face validation failed. Please try another image with better lighting.';
        setVerificationError(errorMsg);
        setIsValidatingFace(false);
        toast.error(`❌ ${errorMsg}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      await handleFileSelect(imageFile);
    } else {
      toast.error('Please drop an image file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await onUploadSuccess(selectedFile);
      // Reset after successful upload
      setSelectedFile(null);
      setPreview(null);
      setVerificationError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setVerificationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          (isValidatingFace || isUploading) ? 'pointer-events-none opacity-50' : 'cursor-pointer'
        )}
        onClick={() => !(isValidatingFace || isUploading) && fileInputRef.current?.click()}
      >
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          disabled={isValidatingFace || isUploading}
        />
        
        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            {isValidatingFace || isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
          </div>
          
          <div>
            <p className="text-sm font-medium">
              {isUploading ? 'Uploading...' :
               isValidatingFace ? 'Verifying face...' :
               'Drop your photo here or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports JPG, PNG, WebP up to 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {verificationError && !selectedFile && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">
                Face Verification Failed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                {verificationError}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                💡 Tip: Make sure you're uploading your own photo with a clear view of your face.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview and Upload */}
      {selectedFile && preview && (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isUploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload Photo
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
