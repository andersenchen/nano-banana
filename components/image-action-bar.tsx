"use client";

import { useState } from "react";
import { Heart, Share, Copy, Check, Link, Globe, Link2, Lock, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface ImageActionBarProps {
  liked: boolean;
  likeCount: number;
  showShare?: boolean;
  imageId?: string;
  visibility?: 'public' | 'unlisted' | 'private';
  isOwner?: boolean;
  onLike: () => void;
  onShare?: () => void;
  onCopy?: () => void;
  onCopyLink?: () => void;
  onVisibilityChange?: (visibility: 'public' | 'unlisted' | 'private') => void;
  onDelete?: () => void;
  className?: string;
}

export default function ImageActionBar({
  liked,
  likeCount,
  showShare = false,
  visibility,
  isOwner,
  onLike,
  onShare,
  onCopy,
  onCopyLink,
  onVisibilityChange,
  onDelete,
  className = ""
}: ImageActionBarProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);

  const visibilityOptions = [
    {
      value: "public" as const,
      label: "Public",
      icon: Globe,
      description: "Anyone can see this image and it appears in the public gallery"
    },
    {
      value: "unlisted" as const,
      label: "Unlisted",
      icon: Link2,
      description: "Anyone with the link can view, but won't appear in public gallery"
    },
    {
      value: "private" as const,
      label: "Private",
      icon: Lock,
      description: "Only you can view this image"
    },
  ];

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
        <button
          onClick={onLike}
          className={`flex items-center space-x-2 p-2 rounded-full transition-all hover:bg-accent ${
            liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
          }`}
        >
          <Heart className={`h-6 w-6 ${liked ? "fill-current" : ""}`} />
          <span className="text-sm font-medium">{likeCount}</span>
        </button>

        <div className="flex items-center gap-0.5">
          {onCopy && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded transition-all hover:bg-accent text-muted-foreground hover:text-foreground"
              title={copySuccess ? "Copied!" : "Copy image"}
            >
              {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="text-xs font-medium whitespace-nowrap hidden lg:inline">
                {copySuccess ? "Copied!" : "Copy image"}
              </span>
            </button>
          )}
          {onCopyLink && (
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded transition-all hover:bg-accent text-muted-foreground hover:text-foreground"
              title={copyLinkSuccess ? "Copied!" : "Copy link"}
            >
              {copyLinkSuccess ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
              <span className="text-xs font-medium whitespace-nowrap hidden lg:inline">
                {copyLinkSuccess ? "Copied!" : "Copy link"}
              </span>
            </button>
          )}
          {showShare && onShare && (
            <button
              onClick={onShare}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              title="Share"
            >
              <Share className="h-4 w-4" />
            </button>
          )}

          {/* Settings menu for owner */}
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-all" title="More options">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[280px]">
                {visibility && onVisibilityChange && (
                  <>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Visibility</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={visibility}
                      onValueChange={(value) => onVisibilityChange(value as 'public' | 'unlisted' | 'private')}
                    >
                      {visibilityOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <DropdownMenuRadioItem
                            key={option.value}
                            value={option.value}
                            className="flex-col items-start py-2.5 cursor-pointer focus:bg-accent [&>span]:top-3"
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <Icon className="h-4 w-4" />
                              <span className="font-medium text-sm">{option.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                              {option.description}
                            </p>
                          </DropdownMenuRadioItem>
                        );
                      })}
                    </DropdownMenuRadioGroup>
                  </>
                )}

                {onDelete && visibility && onVisibilityChange && <DropdownMenuSeparator />}

                {onDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete image
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}