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
    if (image.visibility === "private" && (!user || user.id !== image.user_id)) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: imageId } = await params;
    const { text } = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!text?.trim()) {
      return Response.json({ error: "text is required" }, { status: 400 });
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

    // Check visibility permissions - can't comment on private images unless you own them
    if (image.visibility === "private" && user.id !== image.user_id) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

    const username = user.email?.split("@")[0] || "Anonymous";

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
