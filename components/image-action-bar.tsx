"use client";

import { Heart, MessageCircle, Shuffle, Share, Bookmark } from "lucide-react";

interface ImageActionBarProps {
  liked: boolean;
  bookmarked: boolean;
  likeCount: number;
  commentCount: number;
  showShare?: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onBanana: () => void;
  onShare?: () => void;
  className?: string;
}

export default function ImageActionBar({
  liked,
  bookmarked,
  likeCount,
  commentCount,
  showShare = false,
  onLike,
  onBookmark,
  onBanana,
  onShare,
  className = ""
}: ImageActionBarProps) {
  return (
    <div className={`px-4 py-2 border-b border-border ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onLike}
            className={`flex items-center space-x-2 p-2 rounded-full transition-all hover:bg-accent ${
              liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            }`}
          >
            <Heart className={`h-6 w-6 ${liked ? "fill-current" : ""}`} />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>
          
          <button className="flex items-center space-x-2 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
            <MessageCircle className="h-6 w-6" />
            <span className="text-sm font-medium">{commentCount}</span>
          </button>
          
          <button
            onClick={onBanana}
            className="flex items-center space-x-2 p-2 rounded-full text-muted-foreground hover:text-yellow-500 hover:bg-accent transition-all"
          >
            <Shuffle className="h-6 w-6" />
            <span className="text-sm font-medium">Banana!</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {showShare && onShare && (
            <button
              onClick={onShare}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <Share className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={onBookmark}
            className={`p-2 rounded-full transition-all hover:bg-accent ${
              bookmarked ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
            }`}
          >
            <Bookmark className={`h-5 w-5 ${bookmarked ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}