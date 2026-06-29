/**
 * Comment system types.
 * Used by both API routes and the Comments UI component.
 */

export interface Comment {
  id: string;
  chapter_id: string;
  novel_id: string;
  parent_id: string | null;
  author_name: string;
  author_email?: string; // optional, hashed server-side for privacy
  author_url?: string;
  content: string;
  ip_hash?: string;
  user_agent?: string;
  is_approved: boolean;
  created_at: string; // ISO 8601
}

export interface CommentNode extends Comment {
  replies: CommentNode[];
  depth: number;
}

export interface CreateCommentInput {
  chapter_id: string;
  novel_id: string;
  parent_id?: string | null;
  author_name: string;
  author_email?: string;
  author_url?: string;
  content: string;
  ip_hash?: string;
  user_agent?: string;
}

/** Truncate content for storage / preview */
export const MAX_COMMENT_LENGTH = 5000;
export const MAX_AUTHOR_NAME_LENGTH = 60;
export const MIN_AUTHOR_NAME_LENGTH = 2;
export const MAX_URL_LENGTH = 200;