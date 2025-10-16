import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get direct derivatives (children) of this image
    const { data: derivatives, error } = await supabase
      .from("images")
      .select("id, name, created_at, likes_count, comments_count, visibility, transformation_prompt, generation_depth")
      .eq("source_image_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching derivatives:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!derivatives) {
      return Response.json({ derivatives: [] });
    }

    // Get public URLs for derivatives
    const derivativesWithUrls = derivatives.map((derivative) => {
      const { data: urlData } = supabase.storage
        .from("public-images")
        .getPublicUrl(derivative.name);

      return {
        id: derivative.id,
        name: derivative.name,
        url: urlData.publicUrl,
        likesCount: derivative.likes_count,
        commentsCount: derivative.comments_count,
        visibility: derivative.visibility,
        transformationPrompt: derivative.transformation_prompt,
        generationDepth: derivative.generation_depth,
        createdAt: derivative.created_at,
      };
    });

    return Response.json({ derivatives: derivativesWithUrls });
  } catch (err) {
    console.error("Error fetching derivatives:", err);
    return Response.json(
      { error: "Failed to fetch derivatives" },
      { status: 500 }
    );
  }
}
