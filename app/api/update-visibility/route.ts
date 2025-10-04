import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { imageId, visibility } = await request.json();

    if (!imageId || !visibility) {
      return NextResponse.json(
        { error: "Missing imageId or visibility" },
        { status: 400 }
      );
    }

    if (!['public', 'unlisted', 'private'].includes(visibility)) {
      return NextResponse.json(
        { error: "Invalid visibility value" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update the image visibility, but only if the user owns it
    const { error } = await supabase
      .from("images")
      .update({ visibility })
      .eq("id", imageId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating visibility:", error);
      return NextResponse.json(
        { error: "Failed to update visibility" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update visibility error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
