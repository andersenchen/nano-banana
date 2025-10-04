"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Globe, Link2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { useImageRefresh } from "@/lib/image-refresh-context";
import { Header } from "@/components/header";

interface ImageFile {
  id: string;
  name: string;
  url: string;
  likesCount: number;
  commentsCount: number;
  userLiked?: boolean;
  visibility: 'public' | 'unlisted' | 'private';
}

export default function MyCreations() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingLikes, setPendingLikes] = useState<Set<string>>(new Set());

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastImageRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { refreshKey } = useImageRefresh();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      setIsAuthenticated(true);
    };

    checkAuth();
  }, [router]);

  const fetchImages = useCallback(async (pageNum: number, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    }

    try {
      const response = await fetch(`/api/my-images?page=${pageNum}&limit=20`);

      if (response.status === 401) {
        router.push("/");
        return;
      }

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
  }, [router]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchImages(nextPage, true);
    }
  }, [fetchImages, loadingMore, hasMore, page]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Reset and refetch when pathname changes (navigation) or refreshKey changes
    setPage(1);
    setLoading(true);
    fetchImages(1);
  }, [refreshKey, fetchImages, isAuthenticated, pathname]);

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

    if (lastImageRef.current) {
      observerRef.current.observe(lastImageRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loadMore, images.length]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-8 items-center">
          <Header activePage="my-creations" />
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
        </div>
      </main>
    );
  }

  const handleLike = async (e: React.MouseEvent, imageId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const imageIndex = images.findIndex(img => img.id === imageId);
    if (imageIndex === -1) return;

    const currentImage = images[imageIndex];
    const wasLiked = currentImage.userLiked;

    setPendingLikes(prev => new Set(prev).add(imageId));

    const updatedImages = [...images];
    updatedImages[imageIndex] = {
      ...currentImage,
      userLiked: !wasLiked,
      likesCount: wasLiked ? currentImage.likesCount - 1 : currentImage.likesCount + 1,
    };
    setImages(updatedImages);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });

      const data = await res.json();

      updatedImages[imageIndex] = {
        ...updatedImages[imageIndex],
        userLiked: data.liked,
        likesCount: data.likeCount,
      };
      setImages([...updatedImages]);
    } catch (error) {
      console.error("Error toggling like:", error);
      updatedImages[imageIndex] = currentImage;
      setImages([...updatedImages]);
    } finally {
      setPendingLikes(prev => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    }
  };

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-8 items-center">
          <Header activePage="my-creations" />
          <div className="w-full max-w-5xl px-5">
            <div className="text-center py-8">
              <p className="text-red-500">Error loading images: {error}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-8 items-center">
        <Header activePage="my-creations" />
        <div className="w-full max-w-5xl px-5">
        {images.length === 0 && !loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              You haven&apos;t created any memes yet. Start by uploading an image!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
              {images.map((image, index) => (
                <Link
                  key={image.id}
                  href={`/image/${image.id}?from=my-creations`}
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

                  {/* Visibility indicator - top right */}
                  <div className="absolute top-2 right-2 p-1 bg-black/20 rounded-full backdrop-blur-sm z-10">
                    {image.visibility === 'public' && <Globe className="w-3.5 h-3.5 text-white/70" />}
                    {image.visibility === 'unlisted' && <Link2 className="w-3.5 h-3.5 text-white/70" />}
                    {image.visibility === 'private' && <Lock className="w-3.5 h-3.5 text-white/70" />}
                  </div>

                  {/* Like button - bottom left */}
                  <button
                    onClick={(e) => handleLike(e, image.id)}
                    disabled={pendingLikes.has(image.id)}
                    className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/30 rounded-full px-2 py-1 backdrop-blur-sm hover:bg-black/50 transition-all z-10 disabled:opacity-50"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-all ${
                        image.userLiked
                          ? "text-red-500 fill-current scale-110"
                          : "text-white"
                      }`}
                    />
                    <span className="text-white text-xs font-medium">{image.likesCount}</span>
                  </button>
                </Link>
              ))}
            </div>

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

            <div ref={lastImageRef} className="h-20" />
          </>
        )}
        </div>
      </div>
    </main>
  );
}