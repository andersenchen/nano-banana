"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    async function fetchAllImages() {
      if (!currentUuid) return;

      try {
        const response = await fetch('/api/images?page=1&limit=100');
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        const imageData = data.images.map((img: any) => ({
          id: img.id,
          name: img.name
        }));

        setAllImages(imageData);

        const targetUuid = Array.isArray(currentUuid) ? currentUuid[0] : currentUuid;
        const currentIndex = imageData.findIndex((img: ImageData) => img.id === targetUuid);
        setCurrentImageIndex(currentIndex !== -1 ? currentIndex : 0);
      } catch (error) {
        console.error("Error fetching gallery images:", error);
      }
    }

    fetchAllImages();
  }, [currentUuid]);

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