"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useImageRefresh } from "@/lib/image-refresh-context";

interface ImageFile {
  id: string;
  name: string;
  url: string;
}

export default function MyCreations() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastImageRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
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

    if (refreshKey > 0) {
      setPage(1);
      fetch(`/api/my-images?page=1&limit=20`)
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
      fetchImages(1);
    }
  }, [refreshKey, fetchImages, isAuthenticated]);

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
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-5 py-8">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Gallery
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-8">My Creations</h1>
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
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-5 py-8">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Gallery
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-8">My Creations</h1>
          <div className="text-center py-8">
            <p className="text-red-500">Error loading images: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Gallery
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-8">My Creations</h1>

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
  );
}