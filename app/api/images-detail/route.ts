import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageId = searchParams.get("imageId");

  if (!imageId) {
    return Response.json({ error: "imageId is required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    const { data: image, error } = await supabase
      .from("images")
      .select("id, name, likes_count, comments_count")
      .eq("id", imageId)
      .single();

    if (error || !image) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

    const { data: urlData } = supabase.storage
      .from("public-images")
      .getPublicUrl(image.name);

    const { data: { user } } = await supabase.auth.getUser();

    const [likeData, commentsData] = await Promise.all([
      user ? supabase
        .from("likes")
        .select("id")
        .eq("image_id", imageId)
        .eq("user_id", user.id)
        .single() : Promise.resolve({ data: null }),
      supabase
        .from("comments")
        .select("id, text, user_id, created_at, users(username)")
        .eq("image_id", imageId)
        .order("created_at", { ascending: false })
    ]);

    const userLiked = !!likeData.data;
    const formattedComments = commentsData.data?.map((comment: any) => ({
      id: comment.id,
      text: comment.text,
      username: comment.users?.username || "Anonymous",
      created_at: comment.created_at,
      user_id: comment.user_id,
    })) || [];

    return Response.json({
      image: {
        id: image.id,
        name: image.name,
        url: urlData.publicUrl,
        likes_count: image.likes_count,
        comments_count: image.comments_count,
        user_liked: userLiked,
      },
      comments: formattedComments,
    });
  } catch (err) {
    console.error("Error fetching image detail:", err);
    return Response.json(
      { error: "Failed to fetch image detail" },
      { status: 500 }
    );
  }
}