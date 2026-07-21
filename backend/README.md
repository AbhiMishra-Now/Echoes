# Echoes backend

FastAPI backend for the Echoes biography builder. It keeps biography metadata in a DynamoDB single table and hands the browser short-lived S3 presigned URLs, so media never travels through the API server.

## Architecture

Each user's records share one partition:

| Record | PK | SK |
| --- | --- | --- |
| Biography | `USER#{user_id}` | `BIO#{bio_id}` |
| Chapter | `USER#{user_id}` | `CHAPTER#{chapter_id}` |

Chapters store their `bio_id` as an attribute. This makes the initial single-table design simple; the service queries the user's chapter keys and filters by that biography. At high scale, add a GSI keyed by `BIO#{bio_id}`.

## First: AWS Console setup

Follow the complete manual [AWS setup guide](../docs/aws-setup.md) to create the IAM user/access key, private versioned S3 bucket and CORS policy, and On-Demand DynamoDB table. The script below can create the table instead of the manual console flow.

## Setup

1. Copy `.env.example` to `.env` and supply AWS credentials through your shell, a local profile, or an IAM role. Never commit `.env`.
2. Create the DynamoDB table with `scripts/init_db.py`.
3. Start the API and open `http://localhost:8000/api/v1/docs`.

Exact commands from the `backend` directory:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python scripts/init_db.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

For macOS/Linux activation, use `source .venv/bin/activate`.

## API

All application routes are versioned under `/api/v1`:

- `GET /api/v1/` — health check
- `POST /api/v1/biographies` — create a biography
- `GET /api/v1/biographies/{user_id}` — list the user's biographies
- `POST /api/v1/biographies/{bio_id}/chapters?user_id={user_id}` — create a chapter
- `GET /api/v1/biographies/{bio_id}/chapters?user_id={user_id}` — list chapters
- `PATCH /api/v1/biographies/{bio_id}/chapters/{chapter_id}?user_id={user_id}` — update a chapter
- `POST /api/v1/upload/presigned-url` — create a five-minute direct S3 upload URL

`user_id` is a query parameter until authentication is added. Replace it with the verified identity from your JWT/session before production launch.

## S3 CORS

Configure the media bucket to permit the Next.js origin to `PUT` directly to presigned URLs. A suitable development CORS rule is:

```json
[
  {
    "AllowedHeaders": ["Content-Type"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Keep S3 Block Public Access enabled. The API's returned `file_url` is a canonical object URL; use `generate_presigned_download_url` for private reads. Restrict IAM permissions to this table and bucket prefix in deployment.

## Testing and troubleshooting

Run the no-AWS smoke tests from `backend`:

```powershell
pytest tests -v
```

Manual checks after the server is running:

1. Visit `http://localhost:8000/api/v1/health/`; it returns the API version and configured service status.
2. Visit `http://localhost:8000/api/v1/docs`, use the Swagger UI to create a biography, and confirm it appears in DynamoDB.
3. Call `POST /api/v1/upload/presigned-url` with `filename`, `content_type`, and `chapter_id`; PUT the file directly to the returned `upload_url` with the same `Content-Type` header.

If DynamoDB cannot be found, check `DYNAMODB_TABLE` and run `python scripts/init_db.py`. For credential failures, verify the IAM user/access key and its policies. For browser upload failures, verify both backend CORS and the S3 CORS rule. If port 8000 is occupied, run Uvicorn with `--port 8001` and update the frontend API URL.
