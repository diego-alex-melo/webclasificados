import { randomUUID } from 'crypto';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

// ── Config ──────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_WIDTH = 1200;
const WEBP_QUALITY = 80;
const PHASH_SIZE = 8;

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET = process.env.R2_BUCKET || 'clasificados';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

// ── Errors ──────────────────────────────────────────────────────────────────

export class ImageError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ImageError';
  }
}

// ── Process and Upload ──────────────────────────────────────────────────────

/**
 * Validate, process, and upload an image to R2.
 *
 * Steps:
 * 1. Validate MIME type and size
 * 2. Resize to max 1200px width, convert to WebP, strip EXIF
 * 3. Generate perceptual hash (8x8 grayscale threshold)
 * 4. Upload to R2 with a UUID key
 * 5. Return public URL and perceptual hash
 */
export async function processAndUpload(
  file: Buffer,
  filename: string,
  mimeType?: string,
): Promise<{ url: string; hash: string }> {
  // 1. Validate size
  if (file.length > MAX_FILE_SIZE) {
    throw new ImageError('La imagen no puede superar 5 MB', 400);
  }

  // Detect actual image format via sharp metadata
  const metadata = await sharp(file).metadata();
  const detectedMime = metadata.format ? `image/${metadata.format}` : mimeType;

  if (!detectedMime || !ALLOWED_MIMES.has(detectedMime)) {
    throw new ImageError(
      'Formato de imagen no soportado. Usa JPEG, PNG, WebP o GIF',
      400,
    );
  }

  // 2. Process: resize + WebP + strip metadata
  const processed = await sharp(file)
    .rotate() // auto-rotate based on EXIF before stripping
    .resize(MAX_WIDTH, undefined, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  // 3. Perceptual hash: 8x8 grayscale, threshold at mean
  const hash = await generatePerceptualHash(file);

  // 4. Upload to R2
  const key = `ads/${randomUUID()}.webp`;

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: processed,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000',
    }),
  );

  const url = `${R2_PUBLIC_URL}/${key}`;

  return { url, hash };
}

// ── Perceptual Hash ─────────────────────────────────────────────────────────

/**
 * Generate a simple perceptual hash by:
 * 1. Resize to 8x8 grayscale
 * 2. Compute mean pixel value
 * 3. Threshold each pixel: 1 if >= mean, 0 otherwise
 * 4. Pack into hex string (64 bits = 16 hex chars)
 */
async function generatePerceptualHash(file: Buffer): Promise<string> {
  const pixels = await sharp(file)
    .resize(PHASH_SIZE, PHASH_SIZE, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();

  const totalPixels = PHASH_SIZE * PHASH_SIZE;
  let sum = 0;
  for (let i = 0; i < totalPixels; i++) {
    sum += pixels[i]!;
  }
  const mean = sum / totalPixels;

  // Build 64-bit hash
  let bits = '';
  for (let i = 0; i < totalPixels; i++) {
    bits += pixels[i]! >= mean ? '1' : '0';
  }

  // Convert binary string to hex
  let hex = '';
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }

  return hex;
}
