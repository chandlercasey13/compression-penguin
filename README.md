# Compression Penguin

A serverless image compression app that converts JPEG and PNG images to WebP — with a real-time size comparison showing exactly how much space you saved.

Built with **React**, **AWS Lambda**, **S3**, **DynamoDB**, and **AWS SDK v3**. Deployed with **AWS SAM**.

---

## How It Works

1. Drop a JPEG or PNG into the upload zone
2. The file uploads directly to S3 via a presigned URL (never touches a server)
3. A Lambda function compresses it to WebP using [sharp](https://sharp.pixelplumbing.com/)
4. The UI shows original vs. compressed size with a visual bar comparison
5. Download the optimized WebP file

Typical compression: **50–70% smaller** than the original.

---

## Tech Stack

| Layer          | Technology                                    |
| -------------- | --------------------------------------------- |
| Frontend       | React, Vite                                   |
| API            | Amazon API Gateway (REST)                     |
| Compute        | AWS Lambda (Node.js 20, ARM64/Graviton2)      |
| Storage        | Amazon S3 (presigned URLs for upload/download) |
| Database       | Amazon DynamoDB (job tracking)                |
| Image Processing | sharp (WebP compression, quality 80)        |
| Infrastructure | AWS SAM (CloudFormation)                      |
| Language       | JavaScript (ES modules throughout)            |

---

## Architecture

```
┌──────────────┐       presigned PUT         ┌──────────────┐
│              │ ────────────────────────────▶│              │
│   React UI   │                              │   Amazon S3  │
│   (Vite)     │ ◀────────────────────────────│   uploads/   │
│              │       presigned GET          │   converted/ │
└──────┬───────┘                              └──────▲───▲───┘
       │                                             │   │
       │  REST API                                   │   │
       ▼                                             │   │
┌──────────────┐    ┌──────────────────────┐         │   │
│ API Gateway  │───▶│  Lambda Functions    │         │   │
│              │    │                      │         │   │
│ POST /upload │    │  • GetUploadUrl      │─────────┘   │
│ POST /jobs   │    │  • CreateJob ──async──▶ Convert ───┘
│ GET  /jobs/  │    │  • GetJobStatus      │
│ GET  /dl     │    │  • GetDownloadUrl    │
└──────────────┘    └──────────┬───────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  DynamoDB    │
                        │  Jobs Table  │
                        │  (status,    │
                        │   sizes)     │
                        └──────────────┘
```

**Key design choices:**
- **Presigned URLs** — files go browser ↔ S3 directly, never through API Gateway or Lambda
- **Async processing** — CreateJob Lambda fires the Convert Lambda via `InvocationType: "Event"`, returns immediately
- **ARM64 (Graviton2)** — 20% cheaper, better perf, and matches sharp's native binary on Apple Silicon for local dev
- **Least-privilege IAM** — each Lambda gets only the permissions it needs

---

## Project Structure

```
compression-penguin/
├── backend/
│   ├── src/
│   │   ├── handlers/          # Lambda function handlers
│   │   │   ├── get-upload-url.js
│   │   │   ├── create-job.js
│   │   │   ├── convert.js     # Image compression (sharp → WebP)
│   │   │   ├── get-job-status.js
│   │   │   ├── get-download-url.js
│   │   │   └── list-conversion-types.js
│   │   ├── converters/        # Extensible converter registry
│   │   └── lib/               # S3, DynamoDB, response helpers
│   ├── template.yaml          # AWS SAM infrastructure
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # FileDropZone, StatusDisplay
│   │   ├── hooks/             # useConversion (upload + polling)
│   │   └── lib/               # API client
│   └── package.json
└── README.md
```

---

## Run Locally

**Prerequisites:** Node.js 20+, AWS CLI configured (`aws configure`), an S3 bucket and DynamoDB table created.

```bash
# Backend
cd backend
cp .env.example .env        # fill in your bucket/table names
npm install
node --env-file=.env src/local-server.js

# Frontend (in a second terminal)
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

## Deploy to AWS

```bash
cd backend
sam build --use-container    # builds sharp for Lambda's Linux runtime
sam deploy --guided          # creates all resources via CloudFormation
```

## Deploy Frontend

Host the `frontend/dist/` folder on Netlify, Vercel, or S3 + CloudFront. Set `VITE_API_BASE_URL` to your API Gateway URL.

---

## API

| Method | Endpoint              | Description                     |
| ------ | --------------------- | ------------------------------- |
| POST   | `/upload-url`         | Get presigned S3 upload URL     |
| POST   | `/jobs`               | Create compression job          |
| GET    | `/jobs/:id`           | Poll job status + size data     |
| GET    | `/jobs/:id/download`  | Get presigned download URL      |
| GET    | `/conversion-types`   | List supported formats          |

---

## Built With

- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [AWS SAM](https://aws.amazon.com/serverless/sam/)
- [sharp](https://sharp.pixelplumbing.com/) — high-performance image processing
- [React](https://react.dev/) + [Vite](https://vite.dev/)
