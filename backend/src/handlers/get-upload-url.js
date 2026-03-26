import { v4 as uuidv4 } from "uuid";
import { createPresignedUploadUrl, getInputKey } from "../lib/s3.js";
import { success, error } from "../lib/response.js";

/**
 * POST /upload-url
 * Body: { filename, contentType }
 * Returns: { uploadUrl, key, jobId }
 */
export async function handler(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return error("filename and contentType are required", 400);
    }

    const jobId = uuidv4();
    const key = getInputKey(jobId, filename);
    const uploadUrl = await createPresignedUploadUrl(key, contentType);

    return success({ uploadUrl, key, jobId });
  } catch (err) {
    console.error("get-upload-url error:", err);
    return error("Failed to generate upload URL");
  }
}
