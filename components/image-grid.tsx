"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useImageRefresh } from "@/lib/image-refresh-context";

interface ImageGridProps {
  bucketName?: string;
}

interface ImageFile {
  id: string;
  name: string;
  url: string;
}

export function ImageGrid({ bucketName = "public-images" }: ImageGridProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastImageRef = useRef<HTMLDivElement | null>(null);
  const { refreshKey } = useImageRefresh();

  const fetchImages = useCallback(async (pageNum: number, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    }
    
    try {
      const response = await fetch(
        `/api/images?page=${pageNum}&limit=20&bucket=${bucketName}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (isLoadMore) {
        setImages(prev => [...prev, ...data.images]);
      } else {
        setImages(data.images);
      }
      
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Error fetching images:", err);
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [bucketName]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchImages(nextPage, true);
    }
  }, [fetchImages, loadingMore, hasMore, page]);

  useEffect(() => {
    // Fetch fresh images when refreshKey changes
    if (refreshKey > 0) {
      // Refresh triggered - just swap when ready
      setPage(1);
      fetch(`/api/images?page=1&limit=20&bucket=${bucketName}`)
        .then(response => response.json())
        .then(data => {
          if (data.images) {
            setImages(data.images);
            setHasMore(data.hasMore);
          }
        })
        .catch(err => {
          console.error("Error refreshing images:", err);
        });
    } else {
      // Initial load
      fetchImages(1);
    }
  }, [refreshKey, bucketName]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    // Use a timeout to ensure the ref is attached after render
    const timeoutId = setTimeout(() => {
      if (lastImageRef.current) {
        observerRef.current?.observe(lastImageRef.current);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loadMore, images.length]);

  if (loading) {
    return (
      <div className="w-full max-w-5xl px-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-200 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-5xl px-5">
        <div className="text-center py-8">
          <p className="text-red-500">Error loading images: {error}</p>
        </div>
      </div>
    );
  }

  if (images.length === 0 && !loading) {
    return (
      <div className="w-full max-w-5xl px-5">
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No images found in the bucket
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl px-5">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
        {images.map((image, index) => (
          <Link
            key={image.id}
            href={`/image/${image.id}`}
            className="aspect-square overflow-hidden border border-gray-200 dark:border-gray-800 block group cursor-pointer relative"
          >
            <Image
              src={image.url}
              alt={image.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={index === 0}
              loading={index === 0 ? undefined : "lazy"}
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/30 rounded-full px-2 py-1 backdrop-blur-sm">
              <Heart className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-medium">42</span>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 w-full mt-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`loading-${i}`}
              className="aspect-square bg-gray-200 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      )}
      
      {/* Intersection Observer Target */}
      <div
        ref={lastImageRef}
        className="h-20"
      />
    </div>
  );
}