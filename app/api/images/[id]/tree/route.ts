import { NextRequest } from "next/server";
import {
  notFoundError,
  createErrorResponse,
  ApiErrorCode,
  withErrorHandler
} from "@/lib/api/error-handler";
import { getImageById, getImageTree } from "@/lib/api/queries";
import { formatImagesForResponse } from "@/lib/api/image-helpers";

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  // First, get the root_image_id for this image
  const { data: image, error: imageError } = await getImageById(id, "root_image_id");

  if (imageError || !image) {
    return notFoundError("Image");
  }

  const rootImageId = (image as unknown as { root_image_id: string }).root_image_id;
  if (!rootImageId) {
    return notFoundError("Image");
  }

  // Get all images with the same root_image_id (the entire transformation tree)
  const { data: tree, error } = await getImageTree(rootImageId);

  if (error) {
    return createErrorResponse(ApiErrorCode.DATABASE_ERROR, {
      message: "Failed to fetch transformation tree",
      details: error,
    });
  }

  if (!tree || tree.length === 0) {
    return Response.json({ rootImageId, tree: [] });
  }

  // Format images with URLs and provenance data
  const treeWithUrls = (await formatImagesForResponse(tree, {
    bucketName: "public-images",
    includeProvenance: true,
  })).map((img, index) => ({
    ...img,
    createdAt: tree[index].created_at,
  }));

  return Response.json({
    rootImageId,
    tree: treeWithUrls,
  });
});
