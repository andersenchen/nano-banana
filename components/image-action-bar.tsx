"use client";

import { useState } from "react";
import { Heart, Share, Copy, Check, Link } from "lucide-react";

interface ImageActionBarProps {
  liked: boolean;
  likeCount: number;
  showShare?: boolean;
  onLike: () => void;
  onShare?: () => void;
  onCopy?: () => void;
  onCopyLink?: () => void;
  className?: string;
}

export default function ImageActionBar({
  liked,
  likeCount,
  showShare = false,
  onLike,
  onShare,
  onCopy,
  onCopyLink,
  className = ""
}: ImageActionBarProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);

  const handleCopy = async () => {
    if (onCopy) {
      await onCopy();
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    if (onCopyLink) {
      await onCopyLink();
      setCopyLinkSuccess(true);
      setTimeout(() => setCopyLinkSuccess(false), 2000);
    }
  };

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
        </div>
        
        <div className="flex items-center space-x-2">
          {onCopy && (
            <button
              onClick={handleCopy}
              className="flex items-center space-x-2 p-2 rounded-full transition-all hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              {copySuccess ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              <span className="text-sm font-medium whitespace-nowrap">
                {copySuccess ? "Copied!" : "Copy image"}
              </span>
            </button>
          )}
          {onCopyLink && (
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-2 p-2 rounded-full transition-all hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              {copyLinkSuccess ? <Check className="h-5 w-5" /> : <Link className="h-5 w-5" />}
              <span className="text-sm font-medium whitespace-nowrap">
                {copyLinkSuccess ? "Copied!" : "Copy link"}
              </span>
            </button>
          )}
          {showShare && onShare && (
            <button
              onClick={onShare}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <Share className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}