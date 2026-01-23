#!/bin/bash

# Configuration
PROJECT_ID="your-gcp-project-id"
REGION="us-central1"
REPO_NAME="orderflow-repo"
IMAGE_NAME="orderflow-backend"
SERVICE_NAME="orderflow-api"

# Color codes
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Deployment for $SERVICE_NAME...${NC}"

# 1. Ask for DB Connection String securely
read -s -p "Enter Production DB Connection String: " DB_CONN_STR
echo ""

if [ -z "$DB_CONN_STR" ]; then
  echo "Connection string cannot be empty."
  exit 1
fi

# 2. Submit Build to Cloud Build (Pushes directly to Artifact Registry)
# We use the current timestamp as a tag
TAG=$(date +%Y%m%d-%H%M%S)
FULL_IMAGE_PATH="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:$TAG"

echo -e "${GREEN}Building and Pushing image to $FULL_IMAGE_PATH...${NC}"
gcloud builds submit --tag "$FULL_IMAGE_PATH" .

# 3. Deploy to Cloud Run
echo -e "${GREEN}Deploying to Cloud Run...${NC}"
gcloud run deploy "$SERVICE_NAME" \
  --image "$FULL_IMAGE_PATH" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "ASPNETCORE_ENVIRONMENT=Production" \
  --set-env-vars "ConnectionStrings__DefaultConnection=$DB_CONN_STR" \
  --set-env-vars "JwtSettings__Secret=REPLACE_WITH_REAL_SECRET_OR_USE_GCP_SECRET_MANAGER" \
  --project "$PROJECT_ID"

echo -e "${GREEN}Deployment Complete!${NC}"
