import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const bucketName = searchParams.get("bucket") || "public-images";

  const offset = (page - 1) * limit;

  try {
    const supabase = await createClient();

    const { data: images, error } = await supabase
      .from("images")
      .select("id, name, likes_count, comments_count, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!images) {
      return Response.json({ images: [], hasMore: false });
    }

    const imageData = images.map((image) => {
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(image.name);

      return {
        id: image.id,
        name: image.name,
        url: urlData.publicUrl,
        likesCount: image.likes_count,
        commentsCount: image.comments_count,
      };
    });

    const hasMore = images.length === limit;

    return Response.json({
      images: imageData,
      hasMore,
      page,
      limit
    });
  } catch (err) {
    console.error("Error fetching images:", err);
    return Response.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}