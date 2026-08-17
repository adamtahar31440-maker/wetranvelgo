import { upload } from "@vercel/blob/client";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Phone cameras routinely produce 4-10MB photos, which is what actually makes
// "uploading a photo" feel slow on a mobile connection — the upload itself has
// nothing left to optimize (already a direct-to-blob client upload). Downscale
// and re-encode to JPEG before it ever hits the network. Skip GIFs since
// re-encoding would drop the animation.
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;

export function isUnsupportedImageFile(file: File): boolean {
  const looksLikeHeic = /\.heic$|\.heif$/i.test(file.name) || /heic|heif/i.test(file.type);
  return !ALLOWED_IMAGE_TYPES.includes(file.type) || looksLikeHeic;
}

export async function compressImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // Fall back to the original file if decoding/compression fails for any reason
    // (unsupported format, out-of-memory on a huge image, etc.) — better to upload
    // slowly than to block the user entirely.
    return file;
  }
}

export async function uploadImageFile(file: File): Promise<string> {
  const uploadFile = await compressImage(file);
  const blob = await upload(uploadFile.name, uploadFile, {
    access: "public",
    handleUploadUrl: "/api/upload/image",
  });
  return blob.url;
}
