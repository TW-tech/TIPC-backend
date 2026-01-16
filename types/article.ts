/**
 * Article Content System - TypeScript Type Definitions
 * 
 * Design Principles:
 * 1. Block-based content with strict type safety via discriminated unions
 * 2. Annotations stored at article level (not in blocks) for reference integrity
 * 3. Position-based ordering for simple block reordering without touching content
 * 4. Each block is independently editable via type + data structure
 */

// ============================================================================
// BLOCK DATA TYPES
// ============================================================================

/**
 * Text block data
 * Contains the text content and inline reference markers (e.g., [1], [2])
 */
export interface TextBlockData {
  content: string; // Raw text with inline reference markers like "This is a fact[1]."
}

/**
 * Image block data
 * Contains image source and optional caption
 * Caption can also contain inline reference markers (e.g., "Photo from 2024[1]")
 */
export interface ImageBlockData {
  src: string;
  alt: string;
  caption?: string; // Can include reference markers like "Photo credit: John Doe[1]"
}

/**
 * Quote block data
 * Contains the quote text and optional attribution
 */
export interface QuoteBlockData {
  text: string;
  author?: string;
  source?: string;
}

// ============================================================================
// ARTICLE BLOCKS (Discriminated Union)
// ============================================================================

/**
 * Text block
 */
export interface TextBlock {
  type: "text";
  data: TextBlockData;
}

/**
 * Image block
 */
export interface ImageBlock {
  type: "image";
  data: ImageBlockData;
}

/**
 * Quote block
 */
export interface QuoteBlock {
  type: "quote";
  data: QuoteBlockData;
}

/**
 * Discriminated union of all block types
 * TypeScript will narrow the type based on the "type" field
 */
export type ArticleBlockContent = TextBlock | ImageBlock | QuoteBlock;

/**
 * Article block with metadata
 * Stored in database with id, position, and timestamps
 */
export interface ArticleBlock {
  id: string;
  articleId: string;
  position: number; // 0-indexed, determines display order
  type: "text" | "image" | "quote";
  data: TextBlockData | ImageBlockData | QuoteBlockData;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// ANNOTATIONS (REFERENCES)
// ============================================================================

/**
 * Annotation (reference/citation)
 * Stored at article level, referenced by markers in text blocks
 * Example: marker = "1" corresponds to "[1]" in text
 */
export interface Annotation {
  id: string;
  articleId: string;
  marker: string; // Reference number/marker (e.g., "1", "2", "a")
  text: string; // Full citation/reference text
  url?: string; // Optional link to source
  position: number; // Display order in annotations section
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// OPTIONAL MEDIA ATTACHMENTS
// ============================================================================

/**
 * Video attachment
 * Articles can have multiple videos
 */
export interface Video {
  id: string;
  articleId: string;
  url: string;
  title?: string;
  description?: string;
  duration?: number; // Duration in seconds
  thumbnailUrl?: string;
  position: number; // Display order
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Podcast attachment
 * Articles can have multiple podcasts
 */
export interface Podcast {
  id: string;
  articleId: string;
  url: string;
  title?: string;
  description?: string;
  duration?: number; // Duration in seconds
  position: number; // Display order
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// ARTICLE
// ============================================================================

/**
 * Article with all related content
 * 
 * Design decisions:
 * - Blocks are separate entities for independent editing
 * - Annotations are separate for reference integrity
 * - Videos/podcasts are one-to-many relationships
 * - All relationships use articleId for efficient querying
 */
export interface Article {
  id: string;
  title: string;
  englishTitle?: string;
  slug: string; // URL-friendly identifier
  summary?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Related entities (populated via queries)
  blocks: ArticleBlock[];
  annotations: Annotation[];
  videos: Video[];
  podcasts: Podcast[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for text blocks
 */
export function isTextBlock(block: ArticleBlockContent): block is TextBlock {
  return block.type === "text";
}

/**
 * Type guard for image blocks
 */
export function isImageBlock(block: ArticleBlockContent): block is ImageBlock {
  return block.type === "image";
}

/**
 * Type guard for quote blocks
 */
export function isQuoteBlock(block: ArticleBlockContent): block is QuoteBlock {
  return block.type === "quote";
}
