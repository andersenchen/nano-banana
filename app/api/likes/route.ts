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
    const { data: { user } } = await supabase.auth.getUser();

    const { data: image, error: imageError } = await supabase
      .from("images")
      .select("likes_count")
      .eq("id", imageId)
      .single();

    if (imageError) {
      return Response.json({
        likeCount: 0,
        userLiked: false
      });
    }

    let userLiked = false;
    if (user) {
      const { data: like } = await supabase
        .from("likes")
        .select("id")
        .eq("image_id", imageId)
        .eq("user_id", user.id)
        .single();

      userLiked = !!like;
    }

    return Response.json({
      likeCount: image.likes_count,
      userLiked,
    });
  } catch (err) {
    console.error("Error fetching likes:", err);
    return Response.json(
      { error: "Failed to fetch likes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageId } = await request.json();

    if (!imageId) {
      return Response.json({ error: "imageId is required" }, { status: 400 });
    }

    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("image_id", imageId)
      .eq("user_id", user.id)
      .single();

    if (existingLike) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id);

      if (error) throw error;

      const { data: image } = await supabase
        .from("images")
        .select("likes_count")
        .eq("id", imageId)
        .single();

      return Response.json({
        liked: false,
        likeCount: image?.likes_count || 0,
      });
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({ image_id: imageId, user_id: user.id });

      if (error) throw error;

      const { data: image } = await supabase
        .from("images")
        .select("likes_count")
        .eq("id", imageId)
        .single();

      return Response.json({
        liked: true,
        likeCount: image?.likes_count || 0,
      });
    }
  } catch (err) {
    console.error("Error toggling like:", err);
    return Response.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}