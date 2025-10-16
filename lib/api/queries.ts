import { createClient } from "@/lib/supabase/server";

/**
 * Standard field selections for image queries
 */
export const IMAGE_FIELDS = {
  /** Basic image fields for list views */
  basic: "id, name, likes_count, comments_count, created_at, visibility",

  /** Full image fields including provenance */
  full: "id, name, likes_count, comments_count, created_at, visibility, user_id, source_image_id, transformation_prompt, root_image_id, generation_depth",

  /** Minimal fields for permission checks */
  minimal: "id, visibility, user_id",

  /** Fields for tree/provenance views */
  provenance: "id, name, created_at, likes_count, comments_count, visibility, source_image_id, transformation_prompt, generation_depth, root_image_id",
} as const;


/**
 * Common query: Get public images with pagination
 */
export async function getPublicImages(page: number, limit: number) {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  return supabase
    .from("images")
    .select(IMAGE_FIELDS.basic)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
}

/**
 * Common query: Get user's images with pagination
 */
export async function getUserImages(userId: string, page: number, limit: number) {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  return supabase
    .from("images")
    .select(IMAGE_FIELDS.full)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
}

/**
 * Common query: Get image by ID
 */
export async function getImageById(id: string, fields: string = IMAGE_FIELDS.full) {
  const supabase = await createClient();

  return supabase
    .from("images")
    .select(fields)
    .eq("id", id)
    .single();
}

/**
 * Common query: Get derivatives of an image
 */
export async function getImageDerivatives(sourceImageId: string) {
  const supabase = await createClient();

  return supabase
    .from("images")
    .select(IMAGE_FIELDS.provenance)
    .eq("source_image_id", sourceImageId)
    .order("created_at", { ascending: false });
}

/**
 * Common query: Get full transformation tree
 */
export async function getImageTree(rootImageId: string) {
  const supabase = await createClient();

  return supabase
    .from("images")
    .select(IMAGE_FIELDS.provenance)
    .eq("root_image_id", rootImageId)
    .order("generation_depth", { ascending: true })
    .order("created_at", { ascending: true });
}
