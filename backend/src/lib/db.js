import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "us-east-1";
const TABLE = process.env.JOBS_TABLE;

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const JobStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

export async function createJob(job) {
  await docClient.send(new PutCommand({
    TableName: TABLE,
    Item: job,
  }));
  return job;
}

export async function getJob(jobId) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { id: jobId },
  }));
  return result.Item || null;
}

export async function updateJobStatus(jobId, status, extra = {}) {
  const expressionParts = ["#s = :status", "updatedAt = :now"];
  const names = { "#s": "status" };
  const values = { ":status": status, ":now": new Date().toISOString() };

  if (extra.outputKey) {
    expressionParts.push("outputKey = :outputKey");
    values[":outputKey"] = extra.outputKey;
  }
  if (extra.originalSize !== undefined) {
    expressionParts.push("originalSize = :originalSize");
    values[":originalSize"] = extra.originalSize;
  }
  if (extra.compressedSize !== undefined) {
    expressionParts.push("compressedSize = :compressedSize");
    values[":compressedSize"] = extra.compressedSize;
  }
  if (extra.error) {
    expressionParts.push("#e = :error");
    names["#e"] = "error";
    values[":error"] = extra.error;
  }

  await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { id: jobId },
    UpdateExpression: `SET ${expressionParts.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}

export { docClient, TABLE };
