"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ImageActionBar from "@/components/image-action-bar";
import ImageComments from "@/components/image-comments";
import ImageTransform from "@/components/image-transform";
import ImageTree from "@/components/image-tree";
import type { Comment } from "@/hooks/use-image-interactions";

interface ImageSidebarProps {
  imageName: string;
  transformationPrompt?: string | null;
  liked: boolean;
  likeCount: number;
  comments: Comment[];
  newComment: string;
  showShare?: boolean;
  imageUrl?: string;
  imageId?: string;
  visibility?: 'public' | 'unlisted' | 'private';
  isOwner?: boolean;
  onLike: () => void;
  onShare?: () => void;
  onCopy?: () => void;
  onCopyLink?: () => void;
  onVisibilityChange?: (visibility: 'public' | 'unlisted' | 'private') => void;
  onDelete?: () => void;
  onCommentChange: (value: string) => void;
  onCommentSubmit: (e: React.FormEvent) => void;
  className?: string;
}

export default function ImageSidebar({
  transformationPrompt,
  liked,
  likeCount,
  comments,
  newComment,
  showShare = true,
  imageUrl,
  imageId,
  visibility,
  isOwner,
  onLike,
  onShare,
  onCopy,
  onCopyLink,
  onVisibilityChange,
  onDelete,
  onCommentChange,
  onCommentSubmit,
  className = "lg:col-span-1 bg-white dark:bg-background flex flex-col border-l lg:border-l border-border h-full"
}: ImageSidebarProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'transform' | 'comments' | 'tree' | null;
  const [activeTab, setActiveTab] = useState<'transform' | 'comments' | 'tree'>(
    tabParam && ['transform', 'comments', 'tree'].includes(tabParam) ? tabParam : 'transform'
  );

  // Update active tab when URL changes
  useEffect(() => {
    if (tabParam && ['transform', 'comments', 'tree'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className={className}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold truncate">
          {transformationPrompt ? `"${transformationPrompt}"` : "Uploaded Image"}
        </h2>
      </div>

      <ImageActionBar
        liked={liked}
        likeCount={likeCount}
        showShare={showShare}
        imageId={imageId}
        visibility={visibility}
        isOwner={isOwner}
        onLike={onLike}
        onShare={onShare}
        onCopy={onCopy}
        onCopyLink={onCopyLink}
        onVisibilityChange={onVisibilityChange}
        onDelete={onDelete}
      />

      {/* Tab Toggle */}
      <div className="border-b border-border">
        <div className="flex">
          <button
            onClick={() => setActiveTab('transform')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === 'transform'
                ? 'text-yellow-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Transform
            {activeTab === 'transform' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === 'comments'
                ? 'text-purple-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Comments ({comments.length})
            {activeTab === 'comments' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === 'tree'
                ? 'text-blue-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tree
            {activeTab === 'tree' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'transform' ? (
          <div className="h-full overflow-y-auto">
            <ImageTransform key="transform" imageUrl={imageUrl} imageId={imageId} />
          </div>
        ) : activeTab === 'comments' ? (
          <ImageComments
            key="comments"
            comments={comments}
            newComment={newComment}
            onCommentChange={onCommentChange}
            onCommentSubmit={onCommentSubmit}
            className="h-full"
          />
        ) : (
          <div className="h-full overflow-y-auto">
            <ImageTree key="tree" imageId={imageId || ''} currentImageId={imageId || ''} />
          </div>
        )}
      </div>
    </div>
  );
}