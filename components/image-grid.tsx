"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

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
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchImages() {
      // console.log('🔄 Starting to fetch images from bucket:', bucketName);
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .list("", {
            limit: 100,
            sortBy: { column: "created_at", order: "desc" },
          });

        // console.log('📁 Storage list response:', { data, error });

        if (error) {
          // console.error('❌ Storage list error:', error);
          throw error;
        }

        if (data) {
          // console.log('📄 Total files found:', data.length);
          
          const imageFiles = data.filter((file) =>
            /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
          );
          
          // console.log('🖼️ Image files filtered:', imageFiles.length, 'files');
          // console.log('🖼️ Image file details:', imageFiles.map(f => ({ id: f.id, name: f.name })));

          const imageData = imageFiles.map((file) => {
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(file.name);
            // console.log(`🔗 Generated URL for ${file.name} (ID: ${file.id}):`, urlData.publicUrl);
            return {
              id: file.id,
              name: file.name,
              url: urlData.publicUrl
            };
          });

          // console.log('✅ Final image data:', imageData);
          setImages(imageData);
        } else {
          // console.log('⚠️ No data returned from storage list');
        }
      } catch (err) {
        console.error('💥 Error in fetchImages:', err);
        setError(err instanceof Error ? err.message : "Failed to load images");
      } finally {
        // console.log('🏁 Setting loading to false');
        setLoading(false);
      }
    }

    fetchImages();
  }, [bucketName, supabase.storage]);

  if (loading) {
    return (
      <div className="w-full max-w-5xl px-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
          {Array.from({ length: 8 }).map((_, i) => (
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

  if (images.length === 0) {
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
        {images.map((image) => (
          <Link
            key={image.id}
            href={`/image/${image.id}`}
            className="aspect-square overflow-hidden border border-gray-200 dark:border-gray-800 block group cursor-pointer relative"
          >
            <img
              src={image.url}
              alt={image.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/30 rounded-full px-2 py-1 backdrop-blur-sm">
              <Heart className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-medium">42</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}