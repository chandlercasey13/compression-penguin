/**
 * Compresses a JPEG/PNG image to WebP format.
 * Sharp is loaded dynamically to avoid crashing Lambdas that don't need it.
 * Returns { buffer, originalSize, compressedSize }.
 */
export async function imageToWebp(inputBuffer) {
  const sharp = (await import("sharp")).default;
  const originalSize = inputBuffer.length;

  const outputBuffer = await sharp(inputBuffer)
    .webp({ quality: 80 })
    .toBuffer();

  return {
    buffer: outputBuffer,
    originalSize,
    compressedSize: outputBuffer.length,
  };
}
