# Echoes: The Living Scroll Biography

Echoes is an AI-powered interactive biography builder that turns life memories into a structured 3D scroll and printable heirloom book. Built for the OpenAI Build Week (Codex Hackathon).

## How I Used Codex & GPT-5.6
* **3D Scroll Simulation & Texture Pipeline**: Designed and implemented the Three.js coordinate mapping and dynamic HTML5 offscreen canvas texture generator for rendering polaroid images, text blocks, and drop-caps in 3D space.
* **Asynchronous Serverless Backend**: Developed the FastAPI ASGI endpoint handlers integrated with `aioboto3` for high-concurrency serverless transactions across AWS S3 and DynamoDB.
* **Optimized SSE Streaming & NLP Biographer**: Engineered the server-sent events stream parser for real-time narrative generation via DeepSeek-R1 (on Replicate), preserving system biographical prompt structures.
* **Heirloom PDF Book Compiler**: Designed client-side landscape document generation via `@react-pdf/renderer` extracting memories from both layouts and chat logs.
* **DevOps & Infrastructure**: Authored Serverless Framework configuration for ARM64 Lambda deployment (Graviton2) and automated sanitization workspace utilities.

## Codex Session ID
[INSERT YOUR /feedback SESSION ID HERE]

## Post-Deployment Steps

### 1. IAM User Configuration (AWS Console)
1. Go to **AWS Console** → **IAM** → **Users** → **Create User**.
2. Name the user: `echoes-backend-deployer`.
3. Attach the following policies:
   - `AWSLambda_FullAccess`
   - `AmazonAPIGatewayAdministrator`
   - `IAMFullAccess`
   - `CloudFormationFullAccess`
4. Create and save the Access Key ID and Secret Access Key.

### 2. Local Setup & CLI Configuration
1. Install the Serverless CLI globally:
   ```bash
   npm install -g serverless
   ```
2. Configure your AWS credentials:
   ```bash
   aws configure
   ```
   *Paste Access Key ID, Secret Key, set Region to `us-east-1`, and Output format to `json`.*

### 3. Serverless Backend Deployment (ARM64 Lambda)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Deploy the backend API services:
   ```bash
   serverless deploy
   ```
3. Copy the output endpoint URL (e.g. `https://abc123xyz.execute-api.us-east-1.amazonaws.com`).

### 4. Connect Frontend on Vercel
1. Set `NEXT_PUBLIC_API_URL` to your new API Gateway URL in Vercel settings.
2. Re-trigger deployment.
