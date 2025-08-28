import ImageActionBar from "@/components/image-action-bar";
import ImageComments from "@/components/image-comments";
import type { Comment } from "@/hooks/use-image-interactions";

interface ImageSidebarProps {
  imageName: string;
  liked: boolean;
  bookmarked: boolean;
  likeCount: number;
  comments: Comment[];
  newComment: string;
  showShare?: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onBanana: () => void;
  onShare?: () => void;
  onCommentChange: (value: string) => void;
  onCommentSubmit: (e: React.FormEvent) => void;
  className?: string;
}

export default function ImageSidebar({
  imageName,
  liked,
  bookmarked,
  likeCount,
  comments,
  newComment,
  showShare = true,
  onLike,
  onBookmark,
  onBanana,
  onShare,
  onCommentChange,
  onCommentSubmit,
  className = "lg:col-span-1 bg-white dark:bg-background flex flex-col border-l lg:border-l border-border h-full"
}: ImageSidebarProps) {
  return (
    <div className={className}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold truncate">{imageName || "Image"}</h2>
      </div>

      <ImageActionBar
        liked={liked}
        bookmarked={bookmarked}
        likeCount={likeCount}
        commentCount={comments.length}
        showShare={showShare}
        onLike={onLike}
        onBookmark={onBookmark}
        onBanana={onBanana}
        onShare={onShare}
      />

      <div className="flex-1 min-h-0">
        <ImageComments
          comments={comments}
          newComment={newComment}
          onCommentChange={onCommentChange}
          onCommentSubmit={onCommentSubmit}
          className="h-full"
        />
      </div>
    </div>
  );
}