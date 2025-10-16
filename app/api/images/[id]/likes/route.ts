import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: imageId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: image, error: imageError } = await supabase
      .from("images")
      .select("likes_count, visibility, user_id")
      .eq("id", imageId)
      .single();

    if (imageError || !image) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

    // Check visibility permissions
    if (image.visibility === "private" && (!user || user.id !== image.user_id)) {
      return Response.json({ error: "Image not found" }, { status: 404 });
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: imageId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if image exists and user can access it
    const { data: image, error: imageError } = await supabase
      .from("images")
      .select("id, visibility, user_id")
      .eq("id", imageId)
      .single();

    if (imageError || !image) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

    // Check visibility permissions - can't like private images unless you own them
    if (image.visibility === "private" && user.id !== image.user_id) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("image_id", imageId)
      .eq("user_id", user.id)
      .single();

    if (existingLike) {
      return Response.json(
        { error: "Image already liked" },
        { status: 409 }
      );
    }

    // Create the like
    const { error } = await supabase
      .from("likes")
      .insert({ image_id: imageId, user_id: user.id });

    if (error) throw error;

    // Get updated count
    const { data: updatedImage } = await supabase
      .from("images")
      .select("likes_count")
      .eq("id", imageId)
      .single();

    return Response.json({
      liked: true,
      likeCount: updatedImage?.likes_count || 0,
    });
  } catch (err) {
    console.error("Error liking image:", err);
    return Response.json(
      { error: "Failed to like image" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: imageId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if image exists and user can access it
    const { data: image, error: imageError } = await supabase
      .from("images")
      .select("id, visibility, user_id")
      .eq("id", imageId)
      .single();

    if (imageError || !image) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

    // Check visibility permissions
    if (image.visibility === "private" && user.id !== image.user_id) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete the like
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("image_id", imageId)
      .eq("user_id", user.id);

    if (error) throw error;

    // Get updated count
    const { data: updatedImage } = await supabase
      .from("images")
      .select("likes_count")
      .eq("id", imageId)
      .single();

    return Response.json({
      liked: false,
      likeCount: updatedImage?.likes_count || 0,
    });
  } catch (err) {
    console.error("Error unliking image:", err);
    return Response.json(
      { error: "Failed to unlike image" },
      { status: 500 }
    );
  }
}
