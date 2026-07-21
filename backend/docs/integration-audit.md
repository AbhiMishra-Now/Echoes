# Echoes Integration Audit

Run the automated audit from `backend/` after configuring `backend/.env` and starting the API:

```powershell
python scripts/audit_stack.py
```

It is safe to repeat. The only record it creates uses a generated `audit-` user id and is removed directly from DynamoDB even if a later test fails. It does not call Replicate or require a Replicate token.

## Manual verification checklist — Abhishek

| Phase | Check | Expected result |
|---|---|---|
| Backend | Run `python scripts/init_db.py` | Table creation/access completes; table is `ACTIVE` and On-Demand. |
| Backend | Run `uvicorn app.main:app --reload --port 8000` | Server starts without stack traces. |
| Backend | Open `http://localhost:8000/api/v1/docs` | Swagger UI loads. |
| Backend | Open `http://localhost:8000/api/v1/health/` | `200` with `Echoes Backend is Magical`. |
| Backend | Create a biography in Swagger | A `201` response and matching DynamoDB item appear. |
| Backend | Request `/api/v1/upload/presigned-url` | `upload_url`, `file_key`, and `file_url` are returned. |
| Frontend | Run `npm run dev` from `E:\echoes` | Next.js starts on port `3000`; no missing `/_next` chunks. |
| Frontend | Open `/dashboard` | No browser console CORS/404 errors. |
| Frontend | Inspect Network | API calls target `http://localhost:8000/api/v1`. |
| Frontend | Inspect Zustand | Initial biography state loads without an uncaught error. |
| Frontend | Inspect assets | No broken image, texture, or 3D-scroll assets. |
| Integration | Send chat input without a token | A graceful quill fallback appears; UI does not crash. |
| Integration | Drop a small file | Presigned URL request occurs before the direct S3 `PUT`. |
| Integration | Load dashboard preview | Biography/chapter fetches occur on mount. |
| Integration | Stop backend and retry an action | A user-facing toast appears rather than an application crash. |

## Troubleshooting

| Symptom | Likely cause | Resolution |
|---|---|---|
| CORS error in browser | Missing S3/API origin or wrong frontend API URL | Set `BACKEND_CORS_ORIGINS` to both localhost origins; add local origins to bucket CORS; confirm `NEXT_PUBLIC_API_URL`. |
| `ResourceNotFoundException` / table not found | Wrong region/name or table not created | Run `scripts/init_db.py` using the same `AWS_REGION` and `DYNAMODB_TABLE` as `.env`. |
| Presigned URL fails or expires | Wrong bucket permissions/CORS, expired URL | Verify `s3:PutObject`, bucket CORS, and upload within 300 seconds. |
| `403` from S3 | IAM policy or Block Public Access misunderstanding | Keep Block Public Access enabled; grant the authenticated uploader `PutObject` via the presigned URL policy. |
| Dashboard cannot connect | API process stopped or frontend was not restarted after `.env.local` changed | Start Uvicorn on `8000`, then restart Next.js. |
| Audit cleanup fails | DynamoDB write/delete permission is missing | Grant `dynamodb:DeleteItem` for the table, then remove the generated `USER#audit-*` item manually. |

## Go / No-Go before adding a Replicate token

| Requirement | Decision |
|---|---|
| Backend `.env`, DynamoDB `ACTIVE`, and `PAY_PER_REQUEST` pass | **Must pass** |
| S3 access, local CORS, and all Block Public Access settings pass | **Must pass** |
| API health, create/read-back/cleanup, and presigned URL tests pass | **Must pass** |
| Frontend Axios/SSE checks and a no-token fallback pass | **Must pass** |
| Secrets are excluded from Git and any exposed AWS credentials are rotated | **Must pass** |
| Only visual polish / non-blocking frontend warnings remain | Go after documenting the warning |
| Any Must-pass failure remains | **No-Go** — do not add `REPLICATE_API_TOKEN` |
