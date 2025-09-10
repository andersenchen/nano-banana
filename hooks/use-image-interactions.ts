"use client";

import { useState } from "react";

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export function useImageInteractions(imageUrl?: string) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(1234);
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      text: "Amazing work! Love the composition 🔥",
      author: "user1",
      createdAt: "2h ago"
    },
    {
      id: "2", 
      text: "This is so inspiring! How did you create this?",
      author: "creator_jane",
      createdAt: "5h ago"
    }
  ]);
  const [newComment, setNewComment] = useState("");

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      author: "You",
      createdAt: "now"
    };

    setComments(prev => [comment, ...prev]);
    setNewComment("");
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
    setNewComment,
    handleLike,
    handleComment,
    handleShare,
    handleCopy,
    handleCopyLink,
  };
}