import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    const { data: storageFiles, error: storageError } = await supabase.storage
      .from("public-images")
      .list("", {
        limit: 1000,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (storageError) throw storageError;

    const imageFiles = storageFiles?.filter((file) =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
    ) || [];

    const { data: existingImages } = await supabase
      .from("images")
      .select("id");

    const existingIds = new Set(existingImages?.map(img => img.id) || []);

    const toInsert = imageFiles
      .filter(file => !existingIds.has(file.id))
      .map(file => ({
        id: file.id,
        user_id: file.owner || null,
        name: file.name,
        created_at: file.created_at,
      }));

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("images")
        .insert(toInsert);

      if (insertError) throw insertError;
    }

    return Response.json({
      success: true,
      synced: toInsert.length,
      message: `Synced ${toInsert.length} images`,
    });
  } catch (err) {
    console.error("Error syncing images:", err);
    return Response.json(
      { error: "Failed to sync images" },
      { status: 500 }
    );
  }
}
