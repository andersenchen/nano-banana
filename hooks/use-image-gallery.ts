"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ImageData {
  id: string;
  name: string;
}

interface UseImageGalleryResult {
  allImages: ImageData[];
  currentImageIndex: number;
  handlePrevious: () => void;
  handleNext: () => void;
  navigateToImage: (index: number) => void;
}

export function useImageGallery(currentUuid: string | string[] | undefined): UseImageGalleryResult {
  const [allImages, setAllImages] = useState<ImageData[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchAllImages() {
      if (!currentUuid) return;
      
      try {
        const { data, error } = await supabase.storage
          .from("public-images")
          .list("", { 
            limit: 100,
            sortBy: { column: "created_at", order: "desc" }
          });

        if (error) throw error;

        const imageFiles = data?.filter(file => 
          /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
        ) || [];

        const imageData = imageFiles.map(file => ({
          id: file.id,
          name: file.name
        }));
        
        setAllImages(imageData);
        
        const targetUuid = Array.isArray(currentUuid) ? currentUuid[0] : currentUuid;
        const currentIndex = imageData.findIndex(img => img.id === targetUuid);
        setCurrentImageIndex(currentIndex !== -1 ? currentIndex : 0);
      } catch (error) {
        console.error("Error fetching gallery images:", error);
      }
    }

    fetchAllImages();
  }, [currentUuid, supabase.storage]);

  const navigateToImage = (index: number) => {
    if (index >= 0 && index < allImages.length) {
      const targetImage = allImages[index];
      router.push(`/image/${targetImage.id}`, { scroll: false });
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentImageIndex - 1;
    if (prevIndex >= 0) {
      navigateToImage(prevIndex);
    }
  };

  const handleNext = () => {
    const nextIndex = currentImageIndex + 1;
    if (nextIndex < allImages.length) {
      navigateToImage(nextIndex);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentImageIndex, allImages.length]);

  return {
    allImages,
    currentImageIndex,
    handlePrevious,
    handleNext,
    navigateToImage
  };
}