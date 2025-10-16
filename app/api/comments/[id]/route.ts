import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
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
