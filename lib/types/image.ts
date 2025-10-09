// Database types for images table
export interface ImageRecord {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  visibility: 'public' | 'unlisted' | 'private';
  // Provenance fields
  source_image_id: string | null;
  transformation_prompt: string | null;
  root_image_id: string;
  generation_depth: number;
}

// API response types
export interface ImageData {
  id: string;
  name: string;
  url: string;
  likesCount: number;
  commentsCount: number;
  userLiked?: boolean;
  visibility?: 'public' | 'unlisted' | 'private';
  isOwner?: boolean;
  // Provenance fields
  sourceImageId?: string | null;
  transformationPrompt?: string | null;
  rootImageId?: string;
  generationDepth?: number;
}

// Provenance-specific types
export interface ImageProvenance {
  sourceImageId: string | null;
  transformationPrompt: string | null;
  rootImageId: string;
  generationDepth: number;
}

export interface ImageWithAncestry extends ImageData {
  ancestors: ImageData[];
}

export interface ImageWithDescendants extends ImageData {
  derivatives: ImageData[];
}
