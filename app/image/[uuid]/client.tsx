"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import ImageDisplay from "@/components/image-display";
import ImageSidebar from "@/components/image-sidebar";
import { useImageInteractions } from "@/hooks/use-image-interactions";
import { useImageRefresh } from "@/lib/image-refresh-context";

interface Comment {
  id: string;
  text: string;
  username: string;
  created_at: string;
  user_id: string;
}

interface ImageDetailClientProps {
  uuid: string;
  imageUrl: string;
  imageName: string;
  transformationPrompt: string | null;
  likesCount: number;
  commentsCount: number;
  userLiked: boolean;
  comments: Comment[];
  visibility: 'public' | 'unlisted' | 'private';
  isOwner: boolean;
}

export default function ImageDetailClient({ uuid, imageUrl, imageName, transformationPrompt, likesCount, commentsCount, userLiked, comments: initialComments, visibility, isOwner }: ImageDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { triggerRefresh } = useImageRefresh();
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
    imageId: uuid,
    imageUrl,
    initialLikesCount: likesCount,
    initialCommentsCount: commentsCount,
    initialUserLiked: userLiked,
    initialComments,
  });

  const handleVisibilityChange = async (newVisibility: 'public' | 'unlisted' | 'private') => {
    if (!isOwner) return;

    const previousVisibility = imageVisibility;
    setImageVisibility(newVisibility);

    try {
      const response = await fetch('/api/update-visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: uuid,
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
      const response = await fetch('/api/delete-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: uuid,
        }),
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

  useEffect(() => {
    if (imageName) {
      document.title = imageName;
    }
  }, [imageName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const returnPath = searchParams.get('from') === 'my-creations' ? '/my-creations' : '/';
        router.push(returnPath);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-6xl mx-auto">
          <button
            onClick={() => {
              const returnPath = searchParams.get('from') === 'my-creations' ? '/my-creations' : '/';
              router.push(returnPath);
            }}
            className="flex items-center gap-2 px-4 py-2 hover:bg-accent rounded-lg transition-colors group"
            aria-label="Back to Gallery"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-base font-medium">
              {searchParams.get('from') === 'my-creations' ? 'Back to My Creations' : 'Back to Gallery'}
            </span>
          </button>
          <h1 className="text-lg font-semibold">
            {transformationPrompt ? `"${transformationPrompt}"` : "Uploaded Image"}
          </h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-5 gap-0 lg:gap-8 px-4 lg:px-8">
        {/* Image Section */}
        <div className="lg:col-span-3 h-[80vh] relative">
          <ImageDisplay
            imageUrl={imageUrl}
            imageName={imageName}
          />
        </div>

        {/* Sidebar */}
        <ImageSidebar
          imageName={imageName}
          transformationPrompt={transformationPrompt}
          liked={liked}
          likeCount={likeCount}
          comments={comments}
          newComment={newComment}
          showShare={true}
          imageUrl={imageUrl}
          imageId={uuid}
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
          className="lg:col-span-2 flex flex-col border-l border-border lg:border-l-0"
        />
      </div>
    </div>
  );
}