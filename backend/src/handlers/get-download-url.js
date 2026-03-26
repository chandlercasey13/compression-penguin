import { getJob, JobStatus } from "../lib/db.js";
import { createPresignedDownloadUrl } from "../lib/s3.js";
import { success, error } from "../lib/response.js";

/**
 * GET /jobs/{id}/download
 * Returns a presigned download URL for the converted file.
 */
export async function handler(event) {
  try {
    const jobId = event.pathParameters?.id;

    if (!jobId) {
      return error("Job ID is required", 400);
    }

    const job = await getJob(jobId);

    if (!job) {
      return error("Job not found", 404);
    }

    if (job.status !== JobStatus.COMPLETED) {
      return error(`Job is not complete. Current status: ${job.status}`, 409);
    }

    if (!job.outputKey) {
      return error("No output file found for this job", 500);
    }

    const downloadUrl = await createPresignedDownloadUrl(job.outputKey);

    return success({ downloadUrl, filename: job.outputKey.split("/").pop() });
  } catch (err) {
    console.error("get-download-url error:", err);
    return error("Failed to generate download URL");
  }
}
