"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, Shuffle, Share, Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export default function ImageModal() {
  const params = useParams();
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(1234);
  const [allImages, setAllImages] = useState<Array<{id: string, name: string}>>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      text: "Amazing work! Love the composition 🔥",
      author: "user1",
      createdAt: "2h ago"
    },
    {
      id: "2", 
      text: "This is so inspiring! How did you create this?",
      author: "creator_jane",
      createdAt: "5h ago"
    }
  ]);
  const [newComment, setNewComment] = useState("");

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

  // Reset modal open state when navigating to any image
  useEffect(() => {
    setIsOpen(true);
  }, [params.uuid]);

  // Force modal to be open on component mount
  useEffect(() => {
    setIsOpen(true);
  }, []);


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

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      author: "You",
      createdAt: "now"
    };

    setComments(prev => [comment, ...prev]);
    setNewComment("");
  };

  const handleBanana = () => {
    alert("Banana feature coming soon! 🍌");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Check out this image",
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
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

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 bg-black overflow-hidden">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
          {/* Image Section */}
          <div className="lg:col-span-2 bg-black flex items-center justify-center relative">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={imageName || "Detail view"}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-white/70">Image not found</div>
            )}
          </div>

          {/* Sidebar - Comments Section */}
          <div className="lg:col-span-1 bg-white dark:bg-background flex flex-col border-l border-border max-h-full">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold truncate">{imageName || "Image"}</h2>
            </div>

            {/* Action Bar */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 p-2 rounded-full transition-all hover:bg-accent ${
                      liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                    }`}
                  >
                    <Heart className={`h-6 w-6 ${liked ? "fill-current" : ""}`} />
                    <span className="text-sm font-medium">{likeCount}</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                    <MessageCircle className="h-6 w-6" />
                    <span className="text-sm font-medium">{comments.length}</span>
                  </button>
                  
                  <button
                    onClick={handleBanana}
                    className="flex items-center space-x-2 p-2 rounded-full text-muted-foreground hover:text-yellow-500 hover:bg-accent transition-all"
                  >
                    <Shuffle className="h-6 w-6" />
                    <span className="text-sm font-medium">Banana!</span>
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                  >
                    <Share className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleBookmark}
                    className={`p-2 rounded-full transition-all hover:bg-accent ${
                      bookmarked ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
                    }`}
                  >
                    <Bookmark className={`h-5 w-5 ${bookmarked ? "fill-current" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 border-b border-border last:border-b-0">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {comment.author[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
                      </div>
                      <p className="text-sm text-foreground">{comment.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {comments.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No comments yet</p>
                  <p className="text-sm">Be the first to comment!</p>
                </div>
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleComment} className="p-4 border-t border-border">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 p-3 border-0 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="text-blue-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:text-blue-600 transition-colors"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}