import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ImageDetailClient from "./client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ uuid: string }>;
}

async function getImageData(uuid: string) {
  const supabase = await createClient();

  try {
    const { data: image, error } = await supabase
      .from("images")
      .select("id, name, likes_count, comments_count, visibility, user_id")
      .eq("id", uuid)
      .single();

    if (error || !image) {
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const [likeData, commentsData] = await Promise.all([
      user ? supabase
        .from("likes")
        .select("id")
        .eq("image_id", uuid)
        .eq("user_id", user.id)
        .single() : Promise.resolve({ data: null }),
      supabase
        .from("comments")
        .select("id, text, user_id, username, created_at")
        .eq("image_id", uuid)
        .order("created_at", { ascending: false })
    ]);

    const userLiked = !!likeData.data;
    const { data: urlData } = supabase.storage
      .from("public-images")
      .getPublicUrl(image.name);

    const formattedComments = commentsData.data?.map((comment: { id: string; text: string; username?: string; created_at: string; user_id: string }) => ({
      id: comment.id,
      text: comment.text,
      username: comment.username || "Anonymous",
      created_at: comment.created_at,
      user_id: comment.user_id,
    })) || [];

    return {
      imageUrl: urlData.publicUrl,
      imageName: image.name,
      likesCount: image.likes_count,
      commentsCount: image.comments_count,
      userLiked,
      comments: formattedComments,
      visibility: image.visibility,
      isOwner: user?.id === image.user_id,
    };
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { uuid } = await params;
  const imageData = await getImageData(uuid);
  
  if (!imageData) {
    return {
      title: "Image Not Found",
    };
  }

  const { imageUrl, imageName } = imageData;
  const pageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/image/${uuid}`;
  
  return {
    title: imageName,
    description: `View on mememaker`,
    openGraph: {
      title: imageName,
      description: `View on mememaker`,
      url: pageUrl,
      siteName: "mememaker",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageName,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: imageName,
      description: `View on mememaker`,
      images: [imageUrl],
    },
  };
}

export default async function ImageDetailPage({ params }: PageProps) {
  const { uuid } = await params;
  const imageData = await getImageData(uuid);

  if (!imageData) {
    notFound();
  }

  const { imageUrl, imageName, likesCount, commentsCount, userLiked, comments, visibility, isOwner } = imageData;

  return <ImageDetailClient uuid={uuid} imageUrl={imageUrl} imageName={imageName} likesCount={likesCount} commentsCount={commentsCount} userLiked={userLiked} comments={comments} visibility={visibility} isOwner={isOwner} />;
}