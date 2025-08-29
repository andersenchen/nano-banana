"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Share } from "lucide-react";
import ImageDisplay from "@/components/image-display";
import ImageSidebar from "@/components/image-sidebar";
import LoadingSpinner from "@/components/loading-spinner";
import { useImageInteractions } from "@/hooks/use-image-interactions";
import { useImageFetch } from "@/hooks/use-image-fetch";

export default function ImageDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const { imageUrl, imageName, loading } = useImageFetch(params.uuid);
  
  const {
    liked,
    bookmarked,
    likeCount,
    comments,
    newComment,
    setNewComment,
    handleLike,
    handleBookmark,
    handleComment,
    handleBanana,
    handleShare,
  } = useImageInteractions();

  useEffect(() => {
    if (imageName) {
      document.title = imageName;
    }
  }, [imageName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner variant="dark" />
      </div>
    );
  }

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

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-8 min-h-[calc(100vh-73px)]">
        {/* Image Section */}
        <div className="lg:col-span-2 h-full">
          <ImageDisplay 
            imageUrl={imageUrl} 
            imageName={imageName}
            className="w-full h-full max-h-[80vh] object-contain"
          />
        </div>

        {/* Sidebar */}
        <ImageSidebar
          imageName={imageName}
          liked={liked}
          bookmarked={bookmarked}
          likeCount={likeCount}
          comments={comments}
          newComment={newComment}
          showShare={false}
          imageUrl={imageUrl}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onBanana={handleBanana}
          onCommentChange={setNewComment}
          onCommentSubmit={handleComment}
          className="lg:col-span-1 flex flex-col border-l border-border lg:border-l-0"
        />
      </div>
    </div>
  );
}