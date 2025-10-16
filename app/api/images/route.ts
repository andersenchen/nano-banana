import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import {
  unauthorizedError,
  createErrorResponse,
  ApiErrorCode,
  withErrorHandler
} from "@/lib/api/error-handler";
import { getUserImages, getPublicImages } from "@/lib/api/queries";
import { formatImagesForResponse, getUserLikedImageIds } from "@/lib/api/image-helpers";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const bucketName = searchParams.get("bucket") || "public-images";
  const filter = searchParams.get("filter"); // 'mine' or null

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If filter=mine, require authentication
  if (filter === "mine") {
    if (!user) {
      return unauthorizedError("Authentication required");
    }

    // Get current user's images using query builder
    const { data: images, error } = await getUserImages(user.id, page, limit);

    if (error) {
      return createErrorResponse(ApiErrorCode.DATABASE_ERROR, {
        message: "Failed to fetch images",
        details: error,
      });
    }

    if (!images || images.length === 0) {
      return Response.json({ images: [], hasMore: false, page, limit });
    }

    // Get user's likes for these images
    const userLikedIds = await getUserLikedImageIds(
      user.id,
      images.map(img => img.id)
    );

    // Format images with URLs
    const imageData = await formatImagesForResponse(images, {
      bucketName,
      userLikedIds,
      includeProvenance: false,
    });

    const hasMore = images.length === limit;

    return Response.json({
      images: imageData,
      hasMore,
      page,
      limit
    });
  }

  // Default: get public images using query builder
  const { data: images, error } = await getPublicImages(page, limit);

  if (error) {
    return createErrorResponse(ApiErrorCode.DATABASE_ERROR, {
      message: "Failed to fetch images",
      details: error,
    });
  }

  if (!images || images.length === 0) {
    return Response.json({ images: [], hasMore: false, page, limit });
  }

  // Get user's likes if authenticated
  let userLikedIds: Set<string> = new Set();
  if (user) {
    userLikedIds = await getUserLikedImageIds(
      user.id,
      images.map(img => img.id)
    );
  }

  // Format images with URLs
  const imageData = await formatImagesForResponse(images, {
    bucketName,
    userLikedIds,
    includeProvenance: false,
  });

  const hasMore = images.length === limit;

  return Response.json({
    images: imageData,
    hasMore,
    page,
    limit
  });
});