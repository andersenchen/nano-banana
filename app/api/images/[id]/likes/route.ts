import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { checkImageViewPermission, getAuthenticatedUser } from "@/lib/api/permissions";
import {
  createErrorResponse,
  notFoundError,
  unauthorizedError,
  ApiErrorCode,
  withErrorHandler
} from "@/lib/api/error-handler";

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: imageId } = await params;

  // Check permissions using centralized utility
  const permissionCheck = await checkImageViewPermission(imageId);

  if (!permissionCheck.allowed) {
    return notFoundError("Image");
  }

  const { image, userId } = permissionCheck;
  if (!image) {
    return notFoundError("Image");
  }

  let userLiked = false;
  if (userId) {
    const supabase = await createClient();
    const { data: like } = await supabase
      .from("likes")
      .select("id")
      .eq("image_id", imageId)
      .eq("user_id", userId)
      .single();

    userLiked = !!like;
  }

  return Response.json({
    likeCount: image.likes_count,
    userLiked,
  });
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: imageId } = await params;

  // Check authentication
  const authCheck = await getAuthenticatedUser();
  if (!authCheck.authenticated) {
    return unauthorizedError();
  }

  // Check if user can view the image
  const permissionCheck = await checkImageViewPermission(imageId);
  if (!permissionCheck.allowed) {
    return notFoundError("Image");
  }

  const supabase = await createClient();

  // Check if already liked
  const { data: existingLike } = await supabase
    .from("likes")
    .select("id")
    .eq("image_id", imageId)
    .eq("user_id", authCheck.userId!)
    .single();

  if (existingLike) {
    return createErrorResponse(ApiErrorCode.CONFLICT, {
      message: "Image already liked",
    });
  }

  // Create the like
  const { error } = await supabase
    .from("likes")
    .insert({ image_id: imageId, user_id: authCheck.userId! });

  if (error) {
    return createErrorResponse(ApiErrorCode.DATABASE_ERROR, {
      message: "Failed to like image",
      details: error,
    });
  }

  // Get updated count
  const { data: updatedImage } = await supabase
    .from("images")
    .select("likes_count")
    .eq("id", imageId)
    .single();

  return Response.json({
    liked: true,
    likeCount: updatedImage?.likes_count || 0,
  });
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: imageId } = await params;

  // Check authentication
  const authCheck = await getAuthenticatedUser();
  if (!authCheck.authenticated) {
    return unauthorizedError();
  }

  // Check if user can view the image
  const permissionCheck = await checkImageViewPermission(imageId);
  if (!permissionCheck.allowed) {
    return notFoundError("Image");
  }

  const supabase = await createClient();

  // Delete the like
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("image_id", imageId)
    .eq("user_id", authCheck.userId!);

  if (error) {
    return createErrorResponse(ApiErrorCode.DATABASE_ERROR, {
      message: "Failed to unlike image",
      details: error,
    });
  }

  // Get updated count
  const { data: updatedImage } = await supabase
    .from("images")
    .select("likes_count")
    .eq("id", imageId)
    .single();

  return Response.json({
    liked: false,
    likeCount: updatedImage?.likes_count || 0,
  });
});
