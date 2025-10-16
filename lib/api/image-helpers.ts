import { createClient } from "@/lib/supabase/server";
import type { ImageRecord, ImageData } from "@/lib/types";

/**
 * Gets the public URL for an image from Supabase storage
 *
 * @param imageName - The file name stored in the database
 * @param bucketName - The storage bucket name (default: "public-images")
 * @returns The public URL for the image
 */
export async function getImagePublicUrl(
  imageName: string,
  bucketName: string = "public-images"
): Promise<string> {
  const supabase = await createClient();
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(imageName);

  return data.publicUrl;
}

/**
 * Transforms a database image record into API response format with public URL
 *
 * @param image - Image record from database
 * @param options - Optional configuration
 * @returns Formatted image data for API response
 */
export async function formatImageForResponse(
  image: Partial<ImageRecord>,
  options: {
    bucketName?: string;
    includeUserLiked?: boolean;
    userLiked?: boolean;
    includeProvenance?: boolean;
  } = {}
): Promise<Partial<ImageData>> {
  const {
    bucketName = "public-images",
    includeUserLiked = false,
    userLiked = false,
    includeProvenance = false,
  } = options;

  if (!image.name) {
    throw new Error("Image name is required");
  }

  const url = await getImagePublicUrl(image.name, bucketName);

  const formattedImage: Partial<ImageData> = {
    id: image.id,
    name: image.name,
    url,
    likesCount: image.likes_count,
    commentsCount: image.comments_count,
    visibility: image.visibility,
  };

  if (includeUserLiked) {
    formattedImage.userLiked = userLiked;
  }

  if (includeProvenance && image.transformation_prompt !== undefined) {
    formattedImage.sourceImageId = image.source_image_id;
    formattedImage.transformationPrompt = image.transformation_prompt;
    formattedImage.rootImageId = image.root_image_id;
    formattedImage.generationDepth = image.generation_depth;
  }

  return formattedImage;
}

/**
 * Transforms multiple database image records into API response format
 * Note: This function must be called with an await on createClient()
 *
 * @param images - Array of image records from database
 * @param options - Optional configuration
 * @returns Array of formatted image data
 */
export async function formatImagesForResponse(
  images: Partial<ImageRecord>[],
  options: {
    bucketName?: string;
    userLikedIds?: Set<string>;
    includeProvenance?: boolean;
  } = {}
): Promise<Partial<ImageData>[]> {
  const {
    bucketName = "public-images",
    userLikedIds = new Set(),
    includeProvenance = false,
  } = options;

  const supabase = await createClient();

  return images.map((image) => {
    if (!image.name) {
      throw new Error("Image name is required");
    }

    // Get public URL (this is synchronous once we have the client)
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(image.name);

    const formattedImage: Partial<ImageData> = {
      id: image.id,
      name: image.name,
      url: data.publicUrl,
      likesCount: image.likes_count,
      commentsCount: image.comments_count,
      visibility: image.visibility,
      userLiked: userLikedIds.has(image.id || ""),
    };

    if (includeProvenance && image.transformation_prompt !== undefined) {
      formattedImage.sourceImageId = image.source_image_id;
      formattedImage.transformationPrompt = image.transformation_prompt;
      formattedImage.rootImageId = image.root_image_id;
      formattedImage.generationDepth = image.generation_depth;
    }

    return formattedImage;
  });
}

/**
 * Fetches user's liked image IDs for a set of images
 *
 * @param userId - The user's ID
 * @param imageIds - Array of image IDs to check
 * @returns Set of image IDs that the user has liked
 */
export async function getUserLikedImageIds(
  userId: string,
  imageIds: string[]
): Promise<Set<string>> {
  if (!userId || imageIds.length === 0) {
    return new Set();
  }

  const supabase = await createClient();
  const { data: likes } = await supabase
    .from("likes")
    .select("image_id")
    .eq("user_id", userId)
    .in("image_id", imageIds);

  return new Set(likes?.map(like => like.image_id) || []);
}
