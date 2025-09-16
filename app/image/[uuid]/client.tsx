"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Share } from "lucide-react";
import ImageDisplay from "@/components/image-display";
import ImageSidebar from "@/components/image-sidebar";
import { useImageInteractions } from "@/hooks/use-image-interactions";

interface ImageDetailClientProps {
  uuid: string;
  imageUrl: string;
  imageName: string;
}

export default function ImageDetailClient({ imageUrl, imageName }: ImageDetailClientProps) {
  const router = useRouter();
  
  const {
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
  } = useImageInteractions(imageUrl);

  useEffect(() => {
    if (imageName) {
      document.title = imageName;
    }
  }, [imageName]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-6xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">{imageName || "Image"}</h1>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <Share className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-8">
        {/* Image Section */}
        <div className="lg:col-span-2 h-[80vh] relative">
          <ImageDisplay
            imageUrl={imageUrl}
            imageName={imageName}
          />
        </div>

        {/* Sidebar */}
        <ImageSidebar
          imageName={imageName}
          liked={liked}
          likeCount={likeCount}
          comments={comments}
          newComment={newComment}
          showShare={false}
          imageUrl={imageUrl}
          onLike={handleLike}
          onCopy={handleCopy}
          onCopyLink={handleCopyLink}
          onCommentChange={setNewComment}
          onCommentSubmit={handleComment}
          className="lg:col-span-1 flex flex-col border-l border-border lg:border-l-0"
        />
      </div>
    </div>
  );
}