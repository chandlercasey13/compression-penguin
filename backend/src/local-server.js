/**
 * Lightweight local dev server that simulates API Gateway + Lambda.
 * Run: node src/local-server.js
 *
 * Requires AWS credentials configured locally (via ~/.aws/credentials or env vars)
 * and real S3 bucket + DynamoDB table already created.
 */
import http from "node:http";
import { handler as getUploadUrl } from "./handlers/get-upload-url.js";
import { handler as createJob } from "./handlers/create-job.js";
import { handler as getJobStatus } from "./handlers/get-job-status.js";
import { handler as getDownloadUrl } from "./handlers/get-download-url.js";
import { handler as convert } from "./handlers/convert.js";
import { handler as listConversionTypes } from "./handlers/list-conversion-types.js";

const PORT = process.env.PORT || 3001;

const routes = [
  { method: "POST", pattern: /^\/upload-url$/, handler: getUploadUrl },
  { method: "GET", pattern: /^\/conversion-types$/, handler: listConversionTypes },
  { method: "POST", pattern: /^\/jobs$/, handler: createJobAndConvert },
  { method: "GET", pattern: /^\/jobs\/([^/]+)$/, handler: getJobStatus, param: "id" },
  { method: "GET", pattern: /^\/jobs\/([^/]+)\/download$/, handler: getDownloadUrl, param: "id" },
];

/**
 * In local dev, we invoke the convert handler synchronously instead of
 * async Lambda invocation, since there's no real Lambda to call.
 */
async function createJobAndConvert(event) {
  const originalConvertFn = process.env.CONVERT_FUNCTION_NAME;
  process.env.CONVERT_FUNCTION_NAME = "";
  const result = await createJob(event);
  process.env.CONVERT_FUNCTION_NAME = originalConvertFn;

  if (result.statusCode === 201) {
    const body = JSON.parse(result.body);
    // Fire conversion synchronously in background
    convert({ jobId: body.job.id }).catch((err) =>
      console.error("Local conversion error:", err)
    );
  }

  return result;
}

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  for (const route of routes) {
    if (req.method !== route.method) continue;
    const match = url.pathname.match(route.pattern);
    if (!match) continue;

    try {
      let body = "";
      for await (const chunk of req) body += chunk;

      const event = {
        body: body || null,
        pathParameters: route.param ? { [route.param]: match[1] } : {},
        queryStringParameters: Object.fromEntries(url.searchParams),
      };

      const result = await route.handler(event);

      res.writeHead(result.statusCode, result.headers);
      res.end(result.body);
    } catch (err) {
      console.error("Server error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`Local dev server running at http://localhost:${PORT}`);
  console.log("Routes:");
  console.log("  POST /upload-url");
  console.log("  GET  /conversion-types");
  console.log("  POST /jobs");
  console.log("  GET  /jobs/:id");
  console.log("  GET  /jobs/:id/download");
});
