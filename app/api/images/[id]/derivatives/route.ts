import { NextRequest } from "next/server";
import {
  createErrorResponse,
  ApiErrorCode,
  withErrorHandler
} from "@/lib/api/error-handler";
import { getImageDerivatives } from "@/lib/api/queries";
import { formatImagesForResponse } from "@/lib/api/image-helpers";

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  // Get direct derivatives (children) of this image using query builder
  const { data: derivatives, error } = await getImageDerivatives(id);

  if (error) {
    return createErrorResponse(ApiErrorCode.DATABASE_ERROR, {
      message: "Failed to fetch derivatives",
      details: error,
    });
  }

  if (!derivatives || derivatives.length === 0) {
    return Response.json({ derivatives: [] });
  }

  // Format images with URLs and provenance data
  const derivativesWithUrls = (await formatImagesForResponse(derivatives, {
    bucketName: "public-images",
    includeProvenance: true,
  })).map((img, index) => ({
    ...img,
    createdAt: derivatives[index].created_at,
  }));

  return Response.json({ derivatives: derivativesWithUrls });
});
