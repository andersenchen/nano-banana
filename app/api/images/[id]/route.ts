import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { checkImageViewPermission, checkImageModifyPermission, validateVisibility } from "@/lib/api/permissions";
import {
  createErrorResponse,
  createSuccessResponse,
  notFoundError,
  unauthorizedError,
  validationError,
  ApiErrorCode,
  withErrorHandler
} from "@/lib/api/error-handler";

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  // Check permissions using centralized utility
  const permissionCheck = await checkImageViewPermission(id);

  if (!permissionCheck.allowed) {
    return createErrorResponse(
      permissionCheck.statusCode === 404 ? ApiErrorCode.NOT_FOUND : ApiErrorCode.FORBIDDEN,
      { message: permissionCheck.error }
    );
  }

  const { image, userId } = permissionCheck;
  if (!image) {
    return notFoundError("Image");
  }

  const supabase = await createClient();

  const { data: urlData } = supabase.storage
    .from("public-images")
    .getPublicUrl(image.name);

  const [likeData, commentsData] = await Promise.all([
    userId ? supabase
      .from("likes")
      .select("id")
      .eq("image_id", id)
      .eq("user_id", userId)
      .single() : Promise.resolve({ data: null }),
    supabase
      .from("comments")
      .select("id, text, user_id, username, created_at")
      .eq("image_id", id)
      .order("created_at", { ascending: false })
  ]);

  const userLiked = !!likeData.data;
  const formattedComments = commentsData.data?.map((comment: { id: string; text: string; username?: string; created_at: string; user_id: string }) => ({
    id: comment.id,
    text: comment.text,
    username: comment.username || "Anonymous",
    created_at: comment.created_at,
    user_id: comment.user_id,
  })) || [];

  return Response.json({
    image: {
      id: image.id,
      name: image.name,
      url: urlData.publicUrl,
      likes_count: image.likes_count,
      comments_count: image.comments_count,
      user_liked: userLiked,
      visibility: image.visibility,
      is_owner: userId === image.user_id,
      transformation_prompt: image.transformation_prompt,
    },
    comments: formattedComments,
  });
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();
  const { visibility } = body;

  // Validate visibility value
  if (!visibility) {
    return validationError("Missing visibility field");
  }

  if (!validateVisibility(visibility)) {
    return validationError("Invalid visibility value. Must be 'public', 'unlisted', or 'private'");
  }

  // Check permissions using centralized utility
  const permissionCheck = await checkImageModifyPermission(id);

  if (!permissionCheck.allowed) {
    if (permissionCheck.statusCode === 401) {
      return unauthorizedError();
    }
    if (permissionCheck.statusCode === 403) {
      return createErrorResponse(ApiErrorCode.FORBIDDEN);
    }
    return notFoundError("Image");
  }

  const supabase = await createClient();

  // Update the image visibility
  const { error } = await supabase
    .from("images")
    .update({ visibility })
    .eq("id", id)
    .eq("user_id", permissionCheck.userId);

  if (error) {
    return createErrorResponse(ApiErrorCode.DATABASE_ERROR, {
      message: "Failed to update visibility",
      details: error,
    });
  }

  return createSuccessResponse({ success: true });
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  // Check permissions using centralized utility
  const permissionCheck = await checkImageModifyPermission(id);

  if (!permissionCheck.allowed) {
    if (permissionCheck.statusCode === 401) {
      return unauthorizedError();
    }
    if (permissionCheck.statusCode === 403) {
      return createErrorResponse(ApiErrorCode.FORBIDDEN, {
        message: "You don't have permission to delete this image"
      });
    }
    return notFoundError("Image");
  }

  const { image } = permissionCheck;
  if (!image) {
    return notFoundError("Image");
  }

  const supabase = await createClient();

  // Delete from storage (both buckets if they exist)
  const buckets = ["public-images", "user_images"];
  for (const bucket of buckets) {
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([image.name]);

    // Ignore errors if file doesn't exist in bucket
    if (storageError && !storageError.message.includes("not found")) {
      console.error(`Error deleting from ${bucket}:`, storageError);
    }
  }

  // Delete from database (this will cascade to likes and comments)
  const { error: deleteError } = await supabase
    .from("images")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return createErrorResponse(ApiErrorCode.DATABASE_ERROR, {
      message: "Failed to delete image",
      details: deleteError,
    });
  }

  return createSuccessResponse({ success: true });
});
