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

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_storage_objects")
      .select("id, name, created_at")
      .eq("bucket_id", bucketName)
      .eq("owner", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase error:", error);
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

    const hasMore = data.length === limit;

    return Response.json({
      images: imageData,
      hasMore,
      page,
      limit
    });
  } catch (err) {
    console.error("Error fetching user images:", err);
    return Response.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}