import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { logger } from "./logger";
import { uploadToVercelBlob, deleteFromVercelBlob, isVercelBlobConfigured } from "./vercel-blob-storage";
import { uploadToSupabase, deleteFromSupabase, isSupabaseConfigured } from "./supabase-storage";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "images");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif"];

export interface UploadResult {
  success: boolean;
  filePath?: string;
  error?: string;
  hint?: string;
}

/**
 * Validate uploaded file
 */
export function validateFile(file: { size: number; mimetype: string }): { valid: boolean; error?: string } {
  if (file.size === 0) {
    return { valid: false, error: "File size is 0. Please upload a valid image." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB.` };
  }

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return { valid: false, error: "Only JPG, JPEG, PNG, and GIF formats are allowed." };
  }

  return { valid: true };
}

/**
 * Save uploaded file (uses Supabase if configured, otherwise local storage)
 */
export async function saveFile(file: { buffer: Buffer; originalFilename: string; mimetype?: string }): Promise<UploadResult> {
  logger.info("File upload start", {
    filename: file.originalFilename,
    size: file.buffer.length,
    mimetype: file.mimetype,
  });

  const validation = validateFile({
    size: file.buffer.length,
    mimetype: file.mimetype || "image/jpeg",
  });

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Priority: Vercel Blob > Supabase > Local Storage
  if (isVercelBlobConfigured() && file.mimetype) {
    try {
      const result = await uploadToVercelBlob({
        buffer: file.buffer,
        originalFilename: file.originalFilename,
        mimetype: file.mimetype,
      });
      if (result.success) {
        return result;
      }
      logger.warn("Vercel Blob upload failed; trying next backend", { error: result.error });
    } catch (error) {
      logger.error("Vercel Blob upload error", error);
    }
  }

  if (isSupabaseConfigured() && file.mimetype) {
    try {
      const result = await uploadToSupabase({
        buffer: file.buffer,
        originalFilename: file.originalFilename,
        mimetype: file.mimetype,
      });
      if (result.success) {
        return result;
      }
      logger.warn("Supabase upload failed; trying local storage", { error: result.error });
    } catch (error) {
      logger.error("Supabase upload error", error);
    }
  }

  // Local storage fallback only works in dev. On Vercel the filesystem is
  // read-only outside /tmp, so we must require cloud storage there.
  if (process.env.VERCEL) {
    logger.error("Vercel detected but no cloud storage configured", {});
    return {
      success: false,
      error:
        "File uploads require cloud storage. Configure Vercel Blob (BLOB_READ_WRITE_TOKEN) or Supabase Storage (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).",
      hint: "Vercel Blob: Vercel Dashboard -> Storage -> Blob -> Settings. Supabase: create the storage bucket in Supabase dashboard.",
    };
  }

  try {
    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = file.originalFilename.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${timestamp}_${randomStr}.${extension}`;
    const filePath = join(UPLOAD_DIR, filename);

    // Write file to disk
    await writeFile(filePath, file.buffer);

    // Return path relative to public directory (for Next.js)
    const publicPath = `/uploads/images/${filename}`;
    return { success: true, filePath: publicPath };
  } catch (error) {
    logger.error("Error saving file", error);
    return { success: false, error: "Failed to save file." };
  }
}

/**
 * Delete file (uses Vercel Blob, Supabase, or local storage based on URL)
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  // Check if it's a Vercel Blob URL
  if (filePath.includes('blob.vercel-storage.com') || filePath.includes('public.blob.vercel-storage.com')) {
    return await deleteFromVercelBlob(filePath);
  }

  // Check if it's a Supabase URL
  if (filePath.includes('supabase.co/storage')) {
    return await deleteFromSupabase(filePath);
  }

  // Fallback to local storage
  try {
    // Remove leading slash and convert to absolute path
    const relativePath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
    const absolutePath = join(process.cwd(), "public", relativePath);

    if (existsSync(absolutePath)) {
      await unlink(absolutePath);
      return true;
    }
    return false;
  } catch (error) {
    logger.error("Error deleting file", error);
    return false;
  }
}
