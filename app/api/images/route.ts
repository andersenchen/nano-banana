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
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list("", {
        limit: limit,
        offset: offset,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return Response.json({ images: [], hasMore: false });
    }

    const imageFiles = data.filter((file) =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
    );

    const imageData = imageFiles.map((file) => {
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(file.name);
      return {
        id: file.id,
        name: file.name,
        url: urlData.publicUrl
      };
    });

    // hasMore is true if we got the full limit of files (meaning there might be more)
    const hasMore = data.length === limit;

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