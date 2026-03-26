import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { createJob, JobStatus } from "../lib/db.js";
import { getConverter, listConversionTypes } from "../converters/registry.js";
import { success, error } from "../lib/response.js";

const lambda = new LambdaClient({ region: process.env.AWS_REGION || "us-east-1" });
const CONVERT_FUNCTION = process.env.CONVERT_FUNCTION_NAME;

/**
 * POST /jobs
 * Body: { jobId, filename, inputKey, conversionType }
 * Creates a job record then asynchronously invokes the convert Lambda.
 */
export async function handler(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const { jobId, filename, inputKey, conversionType } = body;

    if (!jobId || !filename || !inputKey || !conversionType) {
      return error("jobId, filename, inputKey, and conversionType are required", 400);
    }

    const converter = getConverter(conversionType);
    if (!converter) {
      const types = listConversionTypes();
      return error(`Unsupported conversion type. Available: ${types.map((t) => t.key).join(", ")}`, 400);
    }

    const job = {
      id: jobId,
      filename,
      inputKey,
      conversionType,
      status: JobStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createJob(job);

    // Async invoke the conversion Lambda (Event = fire-and-forget)
    if (CONVERT_FUNCTION) {
      await lambda.send(new InvokeCommand({
        FunctionName: CONVERT_FUNCTION,
        InvocationType: "Event",
        Payload: Buffer.from(JSON.stringify({ jobId })),
      }));
    }

    return success({ job }, 201);
  } catch (err) {
    console.error("create-job error:", err);
    return error("Failed to create conversion job");
  }
}
