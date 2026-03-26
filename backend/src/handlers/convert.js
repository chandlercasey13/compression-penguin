import { getJob, updateJobStatus, JobStatus } from "../lib/db.js";
import { getObject, putObject, getOutputKey } from "../lib/s3.js";
import { getConverter } from "../converters/registry.js";

/**
 * Async-invoked Lambda that performs image compression.
 * Input: { jobId }
 */
export async function handler(event) {
  const { jobId } = event;

  if (!jobId) {
    console.error("convert: missing jobId");
    return;
  }

  try {
    const job = await getJob(jobId);
    if (!job) {
      console.error(`convert: job ${jobId} not found`);
      return;
    }

    await updateJobStatus(jobId, JobStatus.PROCESSING);

    const converter = getConverter(job.conversionType);
    if (!converter) {
      await updateJobStatus(jobId, JobStatus.FAILED, { error: `Unknown conversion type: ${job.conversionType}` });
      return;
    }

    const s3Response = await getObject(job.inputKey);
    const inputBuffer = Buffer.from(await s3Response.Body.transformToByteArray());

    const result = await converter.convert(inputBuffer);

    const baseName = job.filename.replace(/\.[^.]+$/, "");
    const outputFilename = `${baseName}.${converter.outputExtension}`;
    const outputKey = getOutputKey(jobId, outputFilename);

    await putObject(outputKey, result.buffer, converter.outputContentType);

    await updateJobStatus(jobId, JobStatus.COMPLETED, {
      outputKey,
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
    });

    console.log(`convert: job ${jobId} completed — ${result.originalSize} → ${result.compressedSize} bytes`);
  } catch (err) {
    console.error(`convert: job ${jobId} failed:`, err);
    await updateJobStatus(jobId, JobStatus.FAILED, { error: err.message });
  }
}
