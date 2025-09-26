"use client";

import { useState, useEffect } from "react";
import { Comment } from "./use-image-fetch";

export type { Comment };

interface UseImageInteractionsProps {
  imageId: string;
  imageUrl?: string;
  initialLikesCount?: number;
  initialCommentsCount?: number;
  initialUserLiked?: boolean;
  initialComments?: Comment[];
}

export function useImageInteractions({
  imageId,
  imageUrl,
  initialLikesCount = 0,
  initialUserLiked = false,
  initialComments = [],
}: UseImageInteractionsProps) {
  const [liked, setLiked] = useState(initialUserLiked);
  const [likeCount, setLikeCount] = useState(initialLikesCount);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLiked(initialUserLiked);
  }, [initialUserLiked]);

  useEffect(() => {
    setLikeCount(initialLikesCount);
  }, [initialLikesCount]);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleLike = async () => {
    const wasLiked = liked;
    const previousCount = likeCount;

    setLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });

      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch (error) {
      console.error("Error toggling like:", error);
      setLiked(wasLiked);
      setLikeCount(previousCount);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      text: newComment,
      username: "You",
      created_at: new Date().toISOString(),
      user_id: "temp",
    };

    setComments(prev => [tempComment, ...prev]);
    setNewComment("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, text: newComment }),
      });

      const data = await res.json();
      setComments(prev =>
        prev.map(c => c.id === tempComment.id ? data.comment : c)
      );
    } catch (error) {
      console.error("Error posting comment:", error);
      setComments(prev => prev.filter(c => c.id !== tempComment.id));
    }
  };

  const handleBanana = () => {
    alert("Banana feature coming soon! 🍌");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Check out this image",
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (error) {
      alert("Failed to copy link to clipboard");
    }
  };

  const handleCopy = async () => {
    if (!imageUrl) return;

    try {
      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Check if the browser supports clipboard write for images
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
      } else {
        // Fallback - copy the image URL as text
        await navigator.clipboard.writeText(imageUrl);
        throw new Error("Image clipboard not supported, copied URL instead");
      }
    } catch (error) {
      // Fallback to copying the URL
      try {
        await navigator.clipboard.writeText(imageUrl);
        alert("Image copying not supported, but URL has been copied to clipboard!");
      } catch (e) {
        alert("Failed to copy to clipboard");
      }
    }
  };

  return {
    liked,
    likeCount,
    comments,
    newComment,
    loading,
    setNewComment,
    handleLike,
    handleComment,
    handleShare,
    handleCopy,
    handleCopyLink,
  };
}