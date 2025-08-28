"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseImageFetchResult {
  imageUrl: string;
  imageName: string;
  loading: boolean;
  error: string | null;
}

export function useImageFetch(uuid: string | string[] | undefined): UseImageFetchResult {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchImage() {
      if (!uuid) return;
      
      setLoading(true);
      setError(null);
      
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

        const targetUuid = Array.isArray(uuid) ? uuid[0] : uuid;
        const imageFile = imageFiles.find(file => file.id === targetUuid);

        if (imageFile) {
          const { data: urlData } = supabase.storage
            .from("public-images")
            .getPublicUrl(imageFile.name);
          
          setImageUrl(urlData.publicUrl);
          setImageName(imageFile.name);
        } else {
          setError("Image not found");
        }
      } catch (error) {
        console.error("Error fetching image:", error);
        setError("Failed to fetch image");
      } finally {
        setLoading(false);
      }
    }

    fetchImage();
  }, [uuid, supabase.storage]);

  return {
    imageUrl,
    imageName,
    loading,
    error
  };
}