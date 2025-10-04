import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageId } = await request.json();

    if (!imageId) {
      return Response.json({ error: "Image ID is required" }, { status: 400 });
    }

    // Get image details to verify ownership and get file name
    const { data: image, error: fetchError } = await supabase
      .from("images")
      .select("id, name, user_id")
      .eq("id", imageId)
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
      .eq("id", imageId);

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
