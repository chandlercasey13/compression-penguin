import { getJob } from "../lib/db.js";
import { success, error } from "../lib/response.js";

/**
 * GET /jobs/{id}
 * Returns the current job record.
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

    return success({ job });
  } catch (err) {
    console.error("get-job-status error:", err);
    return error("Failed to get job status");
  }
}
