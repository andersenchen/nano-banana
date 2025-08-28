"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, Shuffle, ArrowLeft, Share, Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export default function ImageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(1234);
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
    async function fetchImage() {
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

        // Find the image by UUID instead of index
        const imageFile = imageFiles.find(file => file.id === params.uuid);

        if (imageFile) {
          const { data: urlData } = supabase.storage
            .from("public-images")
            .getPublicUrl(imageFile.name);
          
          setImageUrl(urlData.publicUrl);
          setImageName(imageFile.name);
        }
      } catch (error) {
        console.error("Error fetching image:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchImage();
  }, [params.uuid, supabase.storage]);

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
    // Placeholder for banana functionality
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
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
        <div className="lg:col-span-2 bg-black flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageName || "Detail view"}
              className="max-w-full max-h-[80vh] object-contain"
            />
          ) : (
            <div className="text-muted-foreground">Image not found</div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 flex flex-col border-l border-border lg:border-l-0">
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

          {/* Comments Section */}
          <div className="flex-1 flex flex-col">
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 border-b border-border last:border-b-0">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {comment.author[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
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
      </div>
    </div>
  );
}