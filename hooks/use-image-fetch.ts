"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Comment {
  id: string;
  text: string;
  username: string;
  created_at: string;
  user_id: string;
}

interface UseImageFetchResult {
  imageUrl: string;
  imageName: string;
  likesCount: number;
  commentsCount: number;
  userLiked: boolean;
  comments: Comment[];
  visibility: 'public' | 'unlisted' | 'private';
  isOwner: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useImageFetch(uuid: string | string[] | undefined): UseImageFetchResult {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [likesCount, setLikesCount] = useState<number>(0);
  const [commentsCount, setCommentsCount] = useState<number>(0);
  const [userLiked, setUserLiked] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private'>('public');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    async function fetchImage() {
      if (!uuid) return;

      setLoading(true);
      setError(null);

      try {
        const targetUuid = Array.isArray(uuid) ? uuid[0] : uuid;

        const response = await fetch(`/api/images-detail?imageId=${targetUuid}&t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          setError("Image not found");
          return;
        }

        const data = await response.json();
        const image = data.image;

        setImageUrl(image.url);
        setImageName(image.name);
        setLikesCount(image.likes_count);
        setCommentsCount(image.comments_count);
        setUserLiked(image.user_liked);
        setComments(data.comments || []);
        setVisibility(image.visibility || 'public');
        setIsOwner(image.is_owner || false);
      } catch (error) {
        console.error("Error fetching image:", error);
        setError("Failed to fetch image");
      } finally {
        setLoading(false);
      }
    }

    fetchImage();
  }, [uuid, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return {
    imageUrl,
    imageName,
    likesCount,
    commentsCount,
    userLiked,
    comments,
    visibility,
    isOwner,
    loading,
    error,
    refetch
  };
}