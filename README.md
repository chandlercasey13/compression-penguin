# Conversion Penguin

A full-stack, Lambda-driven file conversion app built with JavaScript, AWS SDK v3, React, and AWS SAM.

Upload a file, pick a conversion type, and download the converted result — all powered by serverless infrastructure on AWS.

---

## Architecture Summary

```
Browser (React)
    │
    ├─ GET  /conversion-types   → Lambda: list available conversions
    ├─ POST /upload-url         → Lambda: generate presigned S3 PUT URL
    │     └─ PUT file to S3 via presigned URL (direct browser → S3)
    ├─ POST /jobs               → Lambda: create job in DynamoDB, async-invoke convert Lambda
    ├─ GET  /jobs/:id           → Lambda: read job status from DynamoDB
    └─ GET  /jobs/:id/download  → Lambda: generate presigned S3 GET URL
                                     │
                              Convert Lambda (async)
                                     │
                              Read from S3 → Convert → Write to S3
                              Update DynamoDB status
```

**Key design decisions:**
- **Presigned URLs** for upload/download — the browser talks to S3 directly, never sending file bytes through API Gateway or Lambda
- **Async invocation** — the create-job Lambda fires the convert Lambda as `InvocationType: "Event"` (fire-and-forget), so the API responds immediately
- **DynamoDB** for job tracking — lightweight, serverless, pay-per-request
- **Extensible converter registry** — add new formats by dropping a converter function into `backend/src/converters/`

## Supported Conversions

| Key                | Input   | Output  |
| ------------------ | ------- | ------- |
| `csv-to-json`      | `.csv`  | `.json` |
| `markdown-to-html` | `.md`   | `.html` |
| `txt-to-pdf`       | `.txt`  | `.pdf`  |

All use pure-JavaScript libraries (no native binaries), so they run reliably inside Lambda without custom layers.

## Folder Structure

```
conversion-penguin/
├── backend/
│   ├── src/
│   │   ├── handlers/
│   │   │   ├── get-upload-url.js      POST /upload-url
│   │   │   ├── create-job.js          POST /jobs
│   │   │   ├── get-job-status.js      GET  /jobs/:id
│   │   │   ├── get-download-url.js    GET  /jobs/:id/download
│   │   │   ├── convert.js             Async conversion worker
│   │   │   └── list-conversion-types.js  GET /conversion-types
│   │   ├── converters/
│   │   │   ├── registry.js            Converter registry
│   │   │   ├── csv-to-json.js
│   │   │   ├── markdown-to-html.js
│   │   │   └── txt-to-pdf.js
│   │   ├── lib/
│   │   │   ├── s3.js                  S3 client & helpers
│   │   │   ├── db.js                  DynamoDB client & helpers
│   │   │   └── response.js            HTTP response helpers
│   │   └── local-server.js            Local dev server
│   ├── template.yaml                  AWS SAM template
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileDropZone.jsx
│   │   │   ├── ConversionTypeSelect.jsx
│   │   │   └── StatusDisplay.jsx
│   │   ├── hooks/
│   │   │   └── useConversion.js
│   │   ├── lib/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

## Running Locally

### Prerequisites

- **Node.js 20+**
- **An AWS account** with the resources created (see AWS Setup below)
- **AWS CLI** configured with credentials (`aws configure` or environment variables)

### 1. Create AWS Resources

Before running locally, you need a real S3 bucket and DynamoDB table since the local server talks to real AWS services.

```bash
# Create S3 bucket
aws s3 mb s3://conversion-penguin-YOURACCOUNTID --region us-east-1

# Configure CORS on the bucket
aws s3api put-bucket-cors --bucket conversion-penguin-YOURACCOUNTID --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedOrigins": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}'

# Create DynamoDB table
aws dynamodb create-table \
  --table-name ConversionPenguinJobs \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Configure Backend Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your actual bucket name and table name
```

### 3. Start the Backend

```bash
cd backend
node --env-file=.env src/local-server.js
```

The local server runs on `http://localhost:3001` and simulates API Gateway routing. It runs conversions synchronously instead of async Lambda invocation.

### 4. Start the Frontend

```bash
cd frontend
npm run dev
```

Opens at `http://localhost:5173`. The Vite dev server proxies `/api/*` requests to `localhost:3001`.

## Deploying to AWS

### Using AWS SAM

```bash
cd backend

# Build
sam build

# Deploy (guided first time)
sam deploy --guided
```

SAM will create:
- S3 bucket with CORS
- DynamoDB table
- API Gateway (REST)
- 6 Lambda functions with least-privilege IAM roles
- All wiring between them

After deploy, SAM outputs the API URL. Set it in the frontend:

```bash
cd frontend
echo "VITE_API_BASE_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod" > .env
npm run build
```

Host the `dist/` folder on S3 + CloudFront, Vercel, Netlify, or any static host.

## API Reference

| Method | Path                  | Description                          |
| ------ | --------------------- | ------------------------------------ |
| GET    | `/conversion-types`   | List available conversion types      |
| POST   | `/upload-url`         | Get presigned S3 upload URL          |
| POST   | `/jobs`               | Create a conversion job              |
| GET    | `/jobs/:id`           | Get job status                       |
| GET    | `/jobs/:id/download`  | Get presigned download URL (if done) |

### POST /upload-url

**Request:** `{ "filename": "data.csv", "contentType": "text/csv" }`

**Response:** `{ "uploadUrl": "https://s3...", "key": "uploads/<jobId>/data.csv", "jobId": "<uuid>" }`

### POST /jobs

**Request:** `{ "jobId": "<uuid>", "filename": "data.csv", "inputKey": "uploads/<jobId>/data.csv", "conversionType": "csv-to-json" }`

**Response:** `{ "job": { "id": "...", "status": "PENDING", ... } }`

### GET /jobs/:id

**Response:** `{ "job": { "id": "...", "status": "COMPLETED", "outputKey": "converted/...", ... } }`

### GET /jobs/:id/download

**Response:** `{ "downloadUrl": "https://s3...", "filename": "data.json" }`

---

## Adding a New Converter

1. Create `backend/src/converters/my-converter.js`:

```javascript
export async function myConvert(buffer) {
  // Transform the buffer
  const result = doSomething(buffer);
  return Buffer.from(result);
}
```

2. Register it in `backend/src/converters/registry.js`:

```javascript
import { myConvert } from "./my-converter.js";

// Add to the converters object:
"input-to-output": {
  label: "Input → Output",
  convert: myConvert,
  outputExtension: "out",
  outputContentType: "application/octet-stream",
},
```

That's it. The frontend auto-loads available types from the API.

---

## Lambda File Conversion Tradeoffs

**Why these conversions work well in Lambda:**
- `csv-to-json`: Pure string parsing, no dependencies, instant
- `markdown-to-html`: `marked` is a pure JS parser, fast and lightweight
- `txt-to-pdf`: `pdfkit` is pure JavaScript, no native binaries needed

**What's harder in Lambda:**
- **Image conversions** (jpg/png → webp): Require `sharp` or `libvips`, which need native Linux binaries. Possible with Lambda layers or Docker-based Lambda, but adds deployment complexity.
- **Video/audio**: Too slow and memory-intensive for Lambda's 15-minute / 10GB limits. Use ECS/Fargate or MediaConvert instead.
- **Large files**: Lambda has a 512MB `/tmp` disk by default (configurable to 10GB). For files over a few hundred MB, stream processing or ECS is better.

The MVP uses pure-JS converters to keep deployment simple and reliable.

---

## AWS Credentials and Setup Required

### 1. AWS Account Resources That Must Exist

| Resource       | Name / Pattern                          | Purpose                  |
| -------------- | --------------------------------------- | ------------------------ |
| S3 Bucket      | `conversion-penguin-<account-id>`       | File storage             |
| DynamoDB Table | `ConversionPenguinJobs`                 | Job tracking             |
| API Gateway    | Created by SAM                          | HTTP API                 |
| Lambda (×6)    | Created by SAM                          | Business logic           |
| IAM Roles      | Created by SAM (one per Lambda)         | Execution permissions    |

If deploying with SAM, all resources are created automatically from `template.yaml`.

### 2. IAM Permissions for Deployment

The developer deploying needs an IAM user/role with permissions to create:
- CloudFormation stacks
- S3 buckets
- DynamoDB tables
- Lambda functions
- API Gateway APIs
- IAM roles (for Lambda execution roles)

The simplest approach for dev: use `AdministratorAccess` during initial setup, then scope down. For CI/CD, create a deploy role with specific `cloudformation:*`, `s3:*`, `dynamodb:*`, `lambda:*`, `apigateway:*`, `iam:CreateRole/AttachRolePolicy/PassRole` permissions.

### 3. Lambda Runtime Permissions (Least Privilege)

Each Lambda gets only what it needs:

| Function           | Permissions                                      |
| ------------------ | ------------------------------------------------ |
| GetUploadUrl       | `s3:PutObject` on the bucket                     |
| ListConversionTypes| None (no AWS calls)                              |
| CreateJob          | `dynamodb:PutItem`, `lambda:InvokeFunction`      |
| GetJobStatus       | `dynamodb:GetItem`                               |
| GetDownloadUrl     | `dynamodb:GetItem`, `s3:GetObject`               |
| ConvertFunction    | `dynamodb:GetItem/UpdateItem`, `s3:GetObject/PutObject` |

The SAM template implements this via policy templates (`S3CrudPolicy`, `DynamoDBCrudPolicy`, etc.).

### 4. Frontend Access

- The frontend **never** has AWS credentials
- The frontend **only** interacts with AWS through:
  - API Gateway (for job management)
  - Presigned URLs (for S3 upload/download)
- Presigned URLs are time-limited (5 min for upload, 60 min for download)

### 5. Why Presigned URLs

Presigned URLs are preferred because:
- **No credentials in the browser** — the URL itself is the temporary authorization
- **No file bytes through API Gateway** — API Gateway has a 10MB payload limit; presigned URLs bypass this entirely
- **No Lambda memory pressure** — files go directly to/from S3
- **Upload progress** — browser can report `XMLHttpRequest` upload progress
- **Cost** — avoids API Gateway data transfer charges for file content

### 6. Environment Variables — Local Development

**Backend (`.env`):**
```
AWS_REGION=us-east-1
S3_BUCKET=conversion-penguin-123456789012
JOBS_TABLE=ConversionPenguinJobs
ALLOWED_ORIGIN=*
```

**Frontend (`.env`):**
```
VITE_API_BASE_URL=/api   # Uses Vite proxy in dev
```

### 7. Environment Variables — Lambda

Set automatically by the SAM template:
```
S3_BUCKET          → !Ref ConversionBucket
JOBS_TABLE         → !Ref JobsTable
CONVERT_FUNCTION_NAME → !Ref ConvertFunction  (create-job only)
ALLOWED_ORIGIN     → *  (tighten for production)
AWS_REGION         → set by Lambda runtime automatically
```

### 8. Configuration Values to Set

| Config                  | Where                        | Example                                    |
| ----------------------- | ---------------------------- | ------------------------------------------ |
| S3 bucket name          | Backend `.env` + SAM         | `conversion-penguin-123456789012`           |
| DynamoDB table name     | Backend `.env` + SAM         | `ConversionPenguinJobs`                    |
| AWS region              | Backend `.env` + SAM         | `us-east-1`                                |
| API base URL            | Frontend `.env`              | `https://xxxx.execute-api.us-east-1.amazonaws.com/prod` |
| Allowed CORS origin     | Backend `.env` + SAM         | `https://yourdomain.com`                   |

### 9. Local AWS Authentication

For local development, the AWS SDK picks up credentials from (in priority order):
1. Environment variables: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
2. Shared credentials file: `~/.aws/credentials` (set up via `aws configure`)
3. IAM instance profile (if running on EC2)

**Recommended:** Run `aws configure` to set up a local profile. Never commit credentials to code.

### 10. What NOT to Do

- Never put `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` in source code
- Never ship AWS credentials to the frontend bundle
- Never commit `.env` files (they're in `.gitignore`)
- Never give Lambda functions broader permissions than needed

---

## Future Improvements

- **S3 event trigger**: Instead of async Lambda invocation from create-job, trigger the convert Lambda from an S3 `PutObject` event on the `uploads/` prefix. More decoupled, but adds complexity around knowing the conversion type.
- **SQS queue**: Put jobs on an SQS queue for better retry handling, dead-letter queues, and backpressure control.
- **WebSocket notifications**: Replace polling with API Gateway WebSocket for real-time status updates.
- **Image conversions**: Add a Lambda layer with `sharp` prebuilt for `arm64` to support jpg/png → webp.
- **File size limits**: Validate file size on the frontend and enforce via presigned URL conditions.
- **Job expiration**: Add a TTL on DynamoDB records and S3 lifecycle rules to auto-delete old files.
- **Authentication**: Add Cognito or API key auth to prevent unauthorized usage.
- **Rate limiting**: Use API Gateway usage plans and throttling.
- **Monitoring**: Add CloudWatch alarms for failed conversions, Lambda errors, and latency.
- **Multi-file batch**: Support uploading and converting multiple files in one job.
- **Progress streaming**: For longer conversions, update DynamoDB with progress percentage.
