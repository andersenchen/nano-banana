import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { checkImageViewPermission, getAuthenticatedUser } from "@/lib/api/permissions";
import {
  createErrorResponse,
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
  const { id: imageId } = await params;

  // Check permissions using centralized utility
  const permissionCheck = await checkImageViewPermission(imageId);
  if (!permissionCheck.allowed) {
    return notFoundError("Image");
  }

  const supabase = await createClient();

  const { data: comments, error } = await supabase
    .from("comments")
    .select("*")
    .eq("image_id", imageId)
    .order("created_at", { ascending: false });

  if (error) {
    return createErrorResponse(ApiErrorCode.DATABASE_ERROR, {
      message: "Failed to fetch comments",
      details: error,
    });
  }

  return Response.json({ comments: comments || [] });
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: imageId } = await params;
  const body = await request.json();
  const { text } = body;

  // Check authentication
  const authCheck = await getAuthenticatedUser();
  if (!authCheck.authenticated) {
    return unauthorizedError();
  }

  // Validate comment text
  if (!text?.trim()) {
    return validationError("Comment text is required");
  }

  // Check if user can view the image
  const permissionCheck = await checkImageViewPermission(imageId);
  if (!permissionCheck.allowed) {
    return notFoundError("Image");
  }

  const supabase = await createClient();

  // Get user email for username
  const { data: { user } } = await supabase.auth.getUser();
  const username = user?.email?.split("@")[0] || "Anonymous";

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      image_id: imageId,
      user_id: authCheck.userId!,
      username,
      text: text.trim(),
    })
    .select()
    .single();

  if (error) {
    return createErrorResponse(ApiErrorCode.DATABASE_ERROR, {
      message: "Failed to create comment",
      details: error,
    });
  }

  return Response.json({ comment });
});
