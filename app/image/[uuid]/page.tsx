"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Share } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ImageDisplay from "@/components/image-display";
import ImageSidebar from "@/components/image-sidebar";
import { useImageInteractions } from "@/hooks/use-image-interactions";

export default function ImageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
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