"use client";

import { useParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ImageDisplay from "@/components/image-display";
import ImageSidebar from "@/components/image-sidebar";
import LoadingSpinner from "@/components/loading-spinner";
import { useImageInteractions } from "@/hooks/use-image-interactions";
import { useImageFetch } from "@/hooks/use-image-fetch";
import { useImageGallery } from "@/hooks/use-image-gallery";

export default function ImageModal() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const { imageUrl, imageName, loading } = useImageFetch(params.uuid);
  const { allImages, currentImageIndex, handlePrevious, handleNext } = useImageGallery(params.uuid);
  
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

  const handleClose = useCallback(() => {
    router.push('/');
  }, [router]);

  // Keyboard navigation for Escape key (arrow keys handled in useImageGallery)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // Check if we should show the modal based on current path
  const shouldShowModal = pathname.includes('/image/');

  // If not on an image route, don't render the modal
  if (!shouldShowModal) {
    return null;
  }

  if (loading) {
    return (
      <Dialog key={Array.isArray(params.uuid) ? params.uuid[0] : params.uuid} open={true} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 bg-black">
          <DialogTitle className="sr-only">Loading Image</DialogTitle>
          <DialogDescription className="sr-only">Image is loading, please wait</DialogDescription>
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner variant="light" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog key={Array.isArray(params.uuid) ? params.uuid[0] : params.uuid} open={true} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[98vh] h-auto lg:max-h-[95vh] lg:h-auto p-0 bg-black overflow-y-auto lg:overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">{imageName || "Image"}</DialogTitle>
        <DialogDescription className="sr-only">Image detail view with comments and interactions</DialogDescription>

        {/* Navigation Arrows */}
        {currentImageIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        
        {currentImageIndex < allImages.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 lg:h-full lg:min-h-0">
          {/* Image Section */}
          <div className="lg:col-span-2 min-h-[35vh] lg:min-h-0 lg:h-full lg:overflow-hidden">
            <ImageDisplay 
              imageUrl={imageUrl} 
              imageName={imageName} 
            />
          </div>

          {/* Sidebar - Comments Section */}
          <ImageSidebar
            imageName={imageName}
            liked={liked}
            bookmarked={bookmarked}
            likeCount={likeCount}
            comments={comments}
            newComment={newComment}
            showShare={true}
            imageUrl={imageUrl}
            onLike={handleLike}
            onBookmark={handleBookmark}
            onBanana={handleBanana}
            onShare={handleShare}
            onCommentChange={setNewComment}
            onCommentSubmit={handleComment}
            className="lg:col-span-1 bg-white dark:bg-background flex flex-col border-t lg:border-t-0 lg:border-l border-border min-h-[40vh] lg:h-full lg:overflow-y-auto"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}