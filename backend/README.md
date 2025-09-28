# MarkFair Backend

This directory contains the backend server and API code for MarkFair. The backend handles data processing, authentication, and communication between the frontend and blockchain.

## Prerequisites

- Python 3.9+
- Docker (for local Postgres) or a running PostgreSQL 14+

## Setup

1. Create a `.env` with required variables:

```bash
cat > .env <<'EOF'
ENVIRONMENT=development
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/markfair
CLERK_JWKS_URL=your_clerk_jwks_url
CLERK_ISSUER=your_clerk_issuer
CLERK_AUDIENCE=your_clerk_audience
CLERK_SECRET_KEY=sk_test_or_live_from_clerk
YOUTUBE_API_KEY=your_youtube_api_key
EOF
```

2. Start the stack with Docker (API + Postgres):

```bash
docker compose up -d
```

3. Create virtual environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

API will be available at `http://localhost:8000`. To run locally without Docker, skip step 2 and use step 4 below.

4. Run the API server locally (optional):

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

- `GET /api/health`: Healthcheck
- `POST /api/youtube/videos` (auth required): Add a YouTube video URL for the user (validates ownership)
- `GET /api/youtube/videos` (auth required): List user's videos with stats
- `POST /api/wallet/link` (auth required): Link a wallet address to the signed-in user

All auth-required endpoints expect a Clerk JWT in the `Authorization: Bearer <token>` header.

