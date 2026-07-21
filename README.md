# Echoes: The Living Scroll Biography

Echoes is an AI-powered interactive biography builder that turns life memories into a structured 3D scroll and printable heirloom book. Built for the OpenAI Build Week (Codex Hackathon).

## How I Used Codex & GPT-5.6
- Generated complex Three.js scroll texture mapping logic
- Built async FastAPI endpoints with aioboto3 for DynamoDB/S3
- Implemented SSE streaming parser for real-time AI responses
- Created Pydantic models for API validation
- Wrote AWS infrastructure initialization scripts

## Codex Session ID
d35fad1c-ab76-421a-9b0e-0c0f499bf56c

## Post-Deployment Steps
1. Set up AWS IAM user with DynamoDBFullAccess + S3FullAccess
2. Create S3 bucket with CORS config for frontend domain
3. Initialize DynamoDB table via `python scripts/init_db.py`
4. Add Replicate API token to backend environment variables
5. Deploy frontend to Vercel, backend to Render
