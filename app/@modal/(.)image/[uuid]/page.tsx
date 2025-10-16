"use client";

import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ImageDisplay from "@/components/image-display";
import ImageSidebar from "@/components/image-sidebar";
import LoadingSpinner from "@/components/loading-spinner";
import { useImageInteractions } from "@/hooks/use-image-interactions";
import { useImageFetch } from "@/hooks/use-image-fetch";
import { useImageGallery } from "@/hooks/use-image-gallery";
import { useImageRefresh } from "@/lib/context/image-refresh-context";

export default function ImageModal() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { triggerRefresh } = useImageRefresh();

  const { imageUrl, imageName, transformationPrompt, likesCount, commentsCount, userLiked, comments: fetchedComments, visibility, isOwner, loading } = useImageFetch(params.uuid);
  const { allImages, currentImageIndex, handlePrevious, handleNext } = useImageGallery(params.uuid);
  const [imageVisibility, setImageVisibility] = useState(visibility);

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
  } = useImageInteractions({
    imageId: (Array.isArray(params.uuid) ? params.uuid[0] : params.uuid) || '',
    imageUrl,
    initialLikesCount: likesCount,
    initialCommentsCount: commentsCount,
    initialUserLiked: userLiked,
    initialComments: fetchedComments,
  });

  useEffect(() => {
    setImageVisibility(visibility);
  }, [visibility]);

  const handleVisibilityChange = async (newVisibility: 'public' | 'unlisted' | 'private') => {
    if (!isOwner) return;

    const previousVisibility = imageVisibility;
    setImageVisibility(newVisibility);

    try {
      const imageId = Array.isArray(params.uuid) ? params.uuid[0] : params.uuid;
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visibility: newVisibility,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update visibility');
      }

      triggerRefresh();
    } catch (error) {
      console.error('Error updating visibility:', error);
      setImageVisibility(previousVisibility);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;

    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      const imageId = Array.isArray(params.uuid) ? params.uuid[0] : params.uuid;
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      triggerRefresh();
      const returnPath = searchParams.get('from') === 'my-creations' ? '/my-creations' : '/';
      router.push(returnPath);
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image. Please try again.');
    }
  };

  const handleClose = useCallback(() => {
    if (liked !== userLiked) {
      triggerRefresh();
    }
    const returnPath = searchParams.get('from') === 'my-creations' ? '/my-creations' : '/';
    router.push(returnPath);
  }, [router, liked, userLiked, triggerRefresh, searchParams]);

  // Escape key is now handled via Dialog's onEscapeKeyDown prop
  // Arrow keys handled in useImageGallery

  // Check if we should show the modal based on current path
  const shouldShowModal = pathname.includes('/image/');

  // If not on an image route, don't render the modal
  if (!shouldShowModal) {
    return null;
  }

  if (loading) {
    return (
      <Dialog key={Array.isArray(params.uuid) ? params.uuid[0] : params.uuid} open={true} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent
          className="max-w-7xl w-[95vw] h-[90vh] p-0 bg-black"
          onEscapeKeyDown={() => handleClose()}
        >
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
      <DialogContent
        className="max-w-[95vw] w-[95vw] max-h-[98vh] h-auto lg:max-h-[95vh] lg:h-auto p-0 bg-black overflow-y-auto lg:overflow-hidden flex flex-col"
        onEscapeKeyDown={() => handleClose()}
      >
        <DialogTitle className="sr-only">
          {transformationPrompt ? `"${transformationPrompt}"` : "Uploaded Image"}
        </DialogTitle>
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
            transformationPrompt={transformationPrompt}
            liked={liked}
            likeCount={likeCount}
            comments={comments}
            newComment={newComment}
            showShare={true}
            imageUrl={imageUrl}
            imageId={Array.isArray(params.uuid) ? params.uuid[0] : params.uuid}
            visibility={imageVisibility}
            isOwner={isOwner}
            onLike={handleLike}
            onShare={handleShare}
            onCopy={handleCopy}
            onCopyLink={handleCopyLink}
            onVisibilityChange={handleVisibilityChange}
            onDelete={handleDelete}
            onCommentChange={setNewComment}
            onCommentSubmit={handleComment}
            className="lg:col-span-1 bg-white dark:bg-background flex flex-col border-t lg:border-t-0 lg:border-l border-border min-h-[40vh] lg:h-full lg:overflow-y-auto"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}