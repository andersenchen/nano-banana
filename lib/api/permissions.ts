import { createClient } from "@/lib/supabase/server";
import type { ImageRecord, VisibilityType } from "@/lib/types";

/**
 * Result of permission check operation
 */
export interface PermissionCheckResult {
  allowed: boolean;
  image?: ImageRecord;
  userId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Checks if a user has permission to view an image based on visibility settings.
 *
 * Rules:
 * - Public images: Anyone can view
 * - Unlisted images: Anyone with the link can view
 * - Private images: Only the owner can view
 *
 * @param imageId - The UUID of the image to check
 * @returns Permission check result with image data if allowed
 */
export async function checkImageViewPermission(
  imageId: string
): Promise<PermissionCheckResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch the image
    const { data: image, error } = await supabase
      .from("images")
      .select("*")
      .eq("id", imageId)
      .single();

    if (error || !image) {
      return {
        allowed: false,
        error: "Image not found",
        statusCode: 404,
      };
    }

    // Check visibility permissions
    if (image.visibility === "private") {
      // Private images require authentication and ownership
      if (!user || user.id !== image.user_id) {
        return {
          allowed: false,
          error: "Image not found", // Don't reveal existence of private images
          statusCode: 404,
        };
      }
    }

    // Public and unlisted images are viewable
    return {
      allowed: true,
      image: image as ImageRecord,
      userId: user?.id,
    };
  } catch (err) {
    console.error("Permission check error:", err);
    return {
      allowed: false,
      error: "Failed to check permissions",
      statusCode: 500,
    };
  }
}

/**
 * Checks if a user has permission to modify an image.
 * Only the image owner can modify images.
 *
 * @param imageId - The UUID of the image to check
 * @returns Permission check result with image data if allowed
 */
export async function checkImageModifyPermission(
  imageId: string
): Promise<PermissionCheckResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        allowed: false,
        error: "Unauthorized",
        statusCode: 401,
      };
    }

    // Fetch the image
    const { data: image, error } = await supabase
      .from("images")
      .select("*")
      .eq("id", imageId)
      .single();

    if (error || !image) {
      return {
        allowed: false,
        error: "Image not found",
        statusCode: 404,
      };
    }

    // Check ownership
    if (image.user_id !== user.id) {
      return {
        allowed: false,
        error: "Forbidden",
        statusCode: 403,
      };
    }

    return {
      allowed: true,
      image: image as ImageRecord,
      userId: user.id,
    };
  } catch (err) {
    console.error("Permission check error:", err);
    return {
      allowed: false,
      error: "Failed to check permissions",
      statusCode: 500,
    };
  }
}

/**
 * Checks if a user is authenticated.
 *
 * @returns User ID if authenticated, null otherwise
 */
export async function getAuthenticatedUser(): Promise<{
  authenticated: boolean;
  userId?: string;
  error?: string;
  statusCode?: number;
}> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        authenticated: false,
        error: "Unauthorized",
        statusCode: 401,
      };
    }

    return {
      authenticated: true,
      userId: user.id,
    };
  } catch (err) {
    console.error("Authentication check error:", err);
    return {
      authenticated: false,
      error: "Failed to authenticate",
      statusCode: 500,
    };
  }
}

/**
 * Validates that a visibility value is valid
 */
export function validateVisibility(visibility: unknown): visibility is VisibilityType {
  return (
    typeof visibility === "string" &&
    ["public", "unlisted", "private"].includes(visibility)
  );
}
