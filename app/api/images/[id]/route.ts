import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: image, error } = await supabase
      .from("images")
      .select("id, name, likes_count, comments_count, visibility, user_id, transformation_prompt")
      .eq("id", id)
      .single();

    if (error || !image) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

    // Check visibility permissions
    // Private images can only be viewed by the owner
    if (image.visibility === "private" && (!user || user.id !== image.user_id)) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

    const { data: urlData } = supabase.storage
      .from("public-images")
      .getPublicUrl(image.name);

    const [likeData, commentsData] = await Promise.all([
      user ? supabase
        .from("likes")
        .select("id")
        .eq("image_id", id)
        .eq("user_id", user.id)
        .single() : Promise.resolve({ data: null }),
      supabase
        .from("comments")
        .select("id, text, user_id, username, created_at")
        .eq("image_id", id)
        .order("created_at", { ascending: false })
    ]);

    const userLiked = !!likeData.data;
    const formattedComments = commentsData.data?.map((comment: { id: string; text: string; username?: string; created_at: string; user_id: string }) => ({
      id: comment.id,
      text: comment.text,
      username: comment.username || "Anonymous",
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
        visibility: image.visibility,
        is_owner: user?.id === image.user_id,
        transformation_prompt: image.transformation_prompt,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { visibility } = await request.json();

    if (!visibility) {
      return Response.json(
        { error: "Missing visibility" },
        { status: 400 }
      );
    }

    if (!['public', 'unlisted', 'private'].includes(visibility)) {
      return Response.json(
        { error: "Invalid visibility value" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update the image visibility, but only if the user owns it
    const { error } = await supabase
      .from("images")
      .update({ visibility })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating visibility:", error);
      return Response.json(
        { error: "Failed to update visibility" },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Update visibility error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get image details to verify ownership and get file name
    const { data: image, error: fetchError } = await supabase
      .from("images")
      .select("id, name, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !image) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

    // Verify ownership
    if (image.user_id !== user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete from storage (both buckets if they exist)
    const buckets = ["public-images", "user_images"];
    for (const bucket of buckets) {
      await supabase.storage.from(bucket).remove([image.name]);
    }

    // Delete from database (this will cascade to likes and comments)
    const { error: deleteError } = await supabase
      .from("images")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Error deleting image:", err);
    return Response.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
