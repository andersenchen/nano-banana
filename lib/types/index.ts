// ============================================================================
// DATABASE TYPES
// ============================================================================

/**
 * Database record from the `images` table
 */
export interface ImageRecord {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  visibility: VisibilityType;
  // Provenance fields
  source_image_id: string | null;
  transformation_prompt: string | null;
  root_image_id: string;
  generation_depth: number;
}

/**
 * Database record from the `comments` table
 */
export interface CommentRecord {
  id: string;
  image_id: string;
  user_id: string;
  text: string;
  username?: string;
  created_at: string;
}

/**
 * Database record from the `likes` table
 */
export interface LikeRecord {
  id: string;
  image_id: string;
  user_id: string;
  created_at: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Image data returned by API endpoints
 */
export interface ImageData {
  id: string;
  name: string;
  url: string;
  likesCount: number;
  commentsCount: number;
  userLiked?: boolean;
  visibility?: VisibilityType;
  isOwner?: boolean;
  // Provenance fields
  sourceImageId?: string | null;
  transformationPrompt?: string | null;
  rootImageId?: string;
  generationDepth?: number;
}

/**
 * Comment data returned by API endpoints
 */
export interface Comment {
  id: string;
  text: string;
  username: string;
  created_at: string;
  user_id: string;
}

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Visibility options for images
 */
export type VisibilityType = 'public' | 'unlisted' | 'private';

/**
 * All valid visibility values
 */
export const VISIBILITY_VALUES: VisibilityType[] = ['public', 'unlisted', 'private'];

// ============================================================================
// PROVENANCE TYPES
// ============================================================================

/**
 * Image provenance information
 */
export interface ImageProvenance {
  sourceImageId: string | null;
  transformationPrompt: string | null;
  rootImageId: string;
  generationDepth: number;
}

/**
 * Image with ancestor lineage
 */
export interface ImageWithAncestry extends ImageData {
  ancestors: ImageData[];
}

/**
 * Image with derivative/child images
 */
export interface ImageWithDescendants extends ImageData {
  derivatives: ImageData[];
}

// ============================================================================
// API RESPONSE ENVELOPES
// ============================================================================

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a valid visibility type
 */
export function isValidVisibility(value: unknown): value is VisibilityType {
  return typeof value === 'string' && VISIBILITY_VALUES.includes(value as VisibilityType);
}

/**
 * Type guard to check if API response is an error
 */
export function isApiError(response: ApiResponse): response is ApiErrorResponse {
  return response.success === false;
}
