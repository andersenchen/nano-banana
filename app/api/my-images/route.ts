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

    const { data: storageObjects } = await supabase
      .from("user_storage_objects")
      .select("name")
      .eq("bucket_id", bucketName)
      .eq("owner", user.id);

    if (!storageObjects || storageObjects.length === 0) {
      return Response.json({ images: [], hasMore: false });
    }

    const userImageNames = storageObjects
      .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))
      .map((file) => file.name);

    const { data: images, error } = await supabase
      .from("images")
      .select("id, name, likes_count, comments_count, created_at")
      .in("name", userImageNames)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!images) {
      return Response.json({ images: [], hasMore: false });
    }

    const { data: likes } = await supabase
      .from("likes")
      .select("image_id")
      .eq("user_id", user.id)
      .in("image_id", images.map(img => img.id));

    const userLikes = new Set(likes?.map(like => like.image_id) || []);

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
        userLiked: userLikes.has(image.id),
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
    console.error("Error fetching user images:", err);
    return Response.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}