"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from');

  useEffect(() => {
    async function fetchAllImages() {
      if (!currentUuid) return;

      try {
        // Fetch from the appropriate endpoint based on the 'from' parameter
        const endpoint = fromParam === 'my-creations'
          ? '/api/images?filter=mine&page=1&limit=100'
          : '/api/images?page=1&limit=100';

        const response = await fetch(endpoint);
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
  }, [currentUuid, fromParam]);

  const navigateToImage = useCallback((index: number) => {
    if (index >= 0 && index < allImages.length) {
      const targetImage = allImages[index];
      // Preserve the 'from' parameter when navigating
      const url = fromParam
        ? `/image/${targetImage.id}?from=${fromParam}`
        : `/image/${targetImage.id}`;
      router.push(url, { scroll: false });
    }
  }, [allImages, fromParam, router]);

  const handlePrevious = useCallback(() => {
    const prevIndex = currentImageIndex - 1;
    if (prevIndex >= 0) {
      navigateToImage(prevIndex);
    }
  }, [currentImageIndex, navigateToImage]);

  const handleNext = useCallback(() => {
    const nextIndex = currentImageIndex + 1;
    if (nextIndex < allImages.length) {
      navigateToImage(nextIndex);
    }
  }, [currentImageIndex, allImages.length, navigateToImage]);

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
  }, [handlePrevious, handleNext]);

  return {
    allImages,
    currentImageIndex,
    handlePrevious,
    handleNext,
    navigateToImage
  };
}