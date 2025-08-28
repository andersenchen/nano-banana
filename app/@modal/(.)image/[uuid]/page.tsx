"use client";

import { useParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ImageDisplay from "@/components/image-display";
import ImageSidebar from "@/components/image-sidebar";
import { useImageInteractions } from "@/hooks/use-image-interactions";

export default function ImageModal() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [allImages, setAllImages] = useState<Array<{id: string, name: string}>>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
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

  const supabase = createClient();

  useEffect(() => {
    async function fetchImages() {
      if (!params.uuid) return;
      
      try {
        const { data, error } = await supabase.storage
          .from("public-images")
          .list("", { 
            limit: 100,
            sortBy: { column: "created_at", order: "desc" }
          });

        if (error) throw error;

        const imageFiles = data?.filter(file => 
          /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
        ) || [];

        const imageData = imageFiles.map(file => ({
          id: file.id,
          name: file.name
        }));
        
        setAllImages(imageData);
        
        const currentIndex = imageData.findIndex(img => img.id === params.uuid);
        setCurrentImageIndex(currentIndex !== -1 ? currentIndex : 0);
        
        const currentImage = imageData[currentIndex !== -1 ? currentIndex : 0];
        if (currentImage) {
          const { data: urlData } = supabase.storage
            .from("public-images")
            .getPublicUrl(currentImage.name);
          
          setImageUrl(urlData.publicUrl);
          setImageName(currentImage.name);
        }
      } catch (error) {
        console.error("Error fetching images:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchImages();
  }, [params.uuid, supabase.storage]);



  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentImageIndex, allImages.length]);


  const handleClose = () => {
    router.push('/');
  };

  const navigateToImage = (index: number) => {
    if (index >= 0 && index < allImages.length) {
      const targetImage = allImages[index];
      router.push(`/image/${targetImage.id}`, { scroll: false });
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentImageIndex - 1;
    if (prevIndex >= 0) {
      navigateToImage(prevIndex);
    }
  };

  const handleNext = () => {
    const nextIndex = currentImageIndex + 1;
    if (nextIndex < allImages.length) {
      navigateToImage(nextIndex);
    }
  };

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
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog key={Array.isArray(params.uuid) ? params.uuid[0] : params.uuid} open={true} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] p-0 bg-black overflow-y-auto lg:overflow-hidden flex flex-col">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 min-h-0 flex-1">
          {/* Image Section */}
          <div className="lg:col-span-2 min-h-0">
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
            onLike={handleLike}
            onBookmark={handleBookmark}
            onBanana={handleBanana}
            onShare={handleShare}
            onCommentChange={setNewComment}
            onCommentSubmit={handleComment}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}