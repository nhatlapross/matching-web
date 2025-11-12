"use client";

import { addImage } from "@/app/actions/userActions";
import PhotoUploadWithVerification from "@/components/PhotoUploadWithVerification";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-toastify";

export default function MemberPhotoUpload() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'matchme-demo');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload to Cloudinary failed');
      }

      const data = await response.json();

      // Add image to database
      await addImage(data.secure_url, data.public_id);
      
      toast.success('✅ Photo uploaded successfully!');
      router.refresh();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo. Please try again.');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <PhotoUploadWithVerification onUploadSuccess={handleUpload} />
    </div>
  );
}
