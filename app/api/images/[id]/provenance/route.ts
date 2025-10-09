import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Use recursive CTE to get full ancestry chain
    const { data: ancestry, error } = await supabase.rpc('get_image_ancestry', {
      image_id: id
    });

    // If the RPC function doesn't exist yet, fall back to iterative approach
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      // Fallback: iteratively walk up the tree
      const ancestors = [];
      let currentId: string | null = id;

      while (currentId) {
        const { data: image, error: fetchError } = await supabase
          .from("images")
          .select("id, name, created_at, source_image_id, transformation_prompt, generation_depth")
          .eq("id", currentId)
          .single();

        if (fetchError || !image) break;

        ancestors.push({
          id: image.id,
          name: image.name,
          createdAt: image.created_at,
          transformationPrompt: image.transformation_prompt,
          generationDepth: image.generation_depth,
        });

        currentId = image.source_image_id;
      }

      // Reverse to get root first
      ancestors.reverse();

      return Response.json({ ancestry: ancestors });
    }

    if (error) {
      console.error("Error fetching ancestry:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ancestry: ancestry || [] });
  } catch (err) {
    console.error("Error fetching ancestry:", err);
    return Response.json(
      { error: "Failed to fetch ancestry" },
      { status: 500 }
    );
  }
}
