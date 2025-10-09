import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // First, get the root_image_id for this image
    const { data: image, error: imageError } = await supabase
      .from("images")
      .select("root_image_id")
      .eq("id", id)
      .single();

    if (imageError || !image) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

    // Get all images with the same root_image_id (the entire transformation tree)
    const { data: tree, error } = await supabase
      .from("images")
      .select("id, name, created_at, likes_count, comments_count, visibility, source_image_id, transformation_prompt, generation_depth, root_image_id")
      .eq("root_image_id", image.root_image_id)
      .order("generation_depth", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching tree:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!tree) {
      return Response.json({ tree: [] });
    }

    // Get public URLs for tree images
    const treeWithUrls = tree.map((treeImage) => {
      const { data: urlData } = supabase.storage
        .from("public-images")
        .getPublicUrl(treeImage.name);

      return {
        id: treeImage.id,
        name: treeImage.name,
        url: urlData.publicUrl,
        likesCount: treeImage.likes_count,
        commentsCount: treeImage.comments_count,
        visibility: treeImage.visibility,
        sourceImageId: treeImage.source_image_id,
        transformationPrompt: treeImage.transformation_prompt,
        generationDepth: treeImage.generation_depth,
        rootImageId: treeImage.root_image_id,
        createdAt: treeImage.created_at,
      };
    });

    return Response.json({
      rootImageId: image.root_image_id,
      tree: treeWithUrls,
    });
  } catch (err) {
    console.error("Error fetching tree:", err);
    return Response.json(
      { error: "Failed to fetch tree" },
      { status: 500 }
    );
  }
}
