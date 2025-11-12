"use client";

import React, { useState, useRef } from 'react';
import { Button, Image } from '@nextui-org/react';
import { Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';

interface SimpleAvatarUploadProps {
  onFileSelect: (file: File) => void;
  currentPreview?: string | null;
  onRemove?: () => void;
}

export default function SimpleAvatarUpload({
  onFileSelect,
  currentPreview,
  onRemove,
}: SimpleAvatarUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return false;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must not exceed 5MB');
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
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

  return (
    <div className="space-y-4">
      {currentPreview ? (
        <div className="relative inline-block">
          <Image
            src={currentPreview}
            alt="Avatar Preview"
            className="w-32 h-32 rounded-full object-cover"
          />
          {onRemove && (
            <Button
              isIconOnly
              size="sm"
              color="danger"
              className="absolute -top-2 -right-2"
              onPress={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragOver ? 'border-primary bg-primary/5' : 'border-default-300 hover:border-primary'}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
          <Upload className="h-12 w-12 mx-auto mb-2 text-default-400" />
          <p className="text-sm font-medium">Drag & drop or click to select</p>
          <p className="text-xs text-default-500 mt-1">
            Supports JPG, PNG, WebP (max 5MB)
          </p>
        </div>
      )}
    </div>
  );
}
