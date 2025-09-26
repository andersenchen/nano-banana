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

    const { data: comments, error } = await supabase
      .from("comments")
      .select("*")
      .eq("image_id", imageId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Response.json({ comments: comments || [] });
  } catch (err) {
    console.error("Error fetching comments:", err);
    return Response.json(
      { error: "Failed to fetch comments" },
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

    const { imageId, text } = await request.json();

    if (!imageId || !text?.trim()) {
      return Response.json({ error: "imageId and text are required" }, { status: 400 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("username, email")
      .eq("id", user.id)
      .single();

    const username = userData?.username || user.email?.split("@")[0] || "Anonymous";

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        image_id: imageId,
        user_id: user.id,
        username,
        text: text.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({ comment });
  } catch (err) {
    console.error("Error creating comment:", err);
    return Response.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId } = await request.json();

    if (!commentId) {
      return Response.json({ error: "commentId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (err) {
    console.error("Error deleting comment:", err);
    return Response.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}