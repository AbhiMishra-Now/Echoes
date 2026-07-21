# Echoes AWS Console setup

Follow these steps once for a development environment. Use a separate AWS account or separate resources for production.

## 1. Secure the AWS account

1. Sign in to the AWS Console as the account owner and enable MFA on the root user. Do not use root access keys.
2. Open **IAM → Users → Create user** and create `echoes-backend-dev`.
3. Select **Provide user access to the AWS Management Console** only if a human needs console access. For local development, create an access key after the user is created: **IAM → Users → echoes-backend-dev → Security credentials → Create access key → Local code**.
4. For short-lived development setup, attach `AmazonDynamoDBFullAccess` and `AmazonS3FullAccess`. Production must replace these with a least-privilege role limited to the Echoes table and S3 prefix.
5. Save the access key ID and secret in a password manager. AWS shows the secret only once; never paste it into Git or frontend variables.

## 2. Create the private media bucket

1. Open **S3 → Create bucket**.
2. Name it `echoes-media-bucket-{YOUR_INITIALS}`; bucket names are globally unique.
3. Select `us-east-1` or your chosen application region, and use the same region in `.env`.
4. Leave **Block all public access** enabled.
5. Enable **Bucket Versioning** and set default encryption to **SSE-S3 (AES-256)**.
6. Create the bucket. Copy its exact name to `S3_BUCKET` in `backend/.env`.

### Configure S3 CORS

Open the bucket's **Permissions → Cross-origin resource sharing (CORS) → Edit** and save the following development policy. Replace/extend origins for deployed frontends.

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000", "http://localhost:8000"],
    "ExposeHeaders": ["ETag", "x-amz-server-side-encryption"],
    "MaxAgeSeconds": 3000
  }
]
```

The bucket stays private: browsers upload using a 300-second presigned PUT URL. Read access should use presigned GET URLs rather than a public bucket policy.

## 3. Create the DynamoDB table

Either run `python backend/scripts/init_db.py` after configuring `.env`, or create it manually:

1. Open **DynamoDB → Tables → Create table**.
2. Set the name to `echoes_biographies`.
3. Set partition key `PK` (String) and sort key `SK` (String).
4. Choose **On-demand (PAY_PER_REQUEST)** capacity, default AWS-owned encryption, and leave TTL disabled.
5. Create the table and enter the table name in `DYNAMODB_TABLE`.

Echoes stores biographies as `PK=USER#{user_id}, SK=BIO#{bio_id}` and chapters as `PK=USER#{user_id}, SK=CHAPTER#{chapter_id}`.

## 4. Configure local variables

From `backend`, create the private local settings file:

```powershell
Copy-Item .env.example .env
```

Edit `.env` with the region, IAM access key, secret, actual bucket name, and DynamoDB table. Confirm `.env` remains ignored by Git.

## Production checklist

- Use an ECS/Lambda instance role, never long-lived access keys.
- Replace broad development policies with least privilege for the exact table and `chapters/*` object prefix.
- Set `DEBUG=False`, HTTPS-only CORS origins, a unique `SECRET_KEY`, CloudWatch alarms, and AWS Budgets.
- Protect API routes with verified authentication before accepting user IDs from requests.
