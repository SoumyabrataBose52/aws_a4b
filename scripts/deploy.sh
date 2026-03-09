#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# Nexus Solo — AWS Deployment Script
# Usage: ./scripts/deploy.sh [stack-name] [db-password]
# Prerequisites: AWS CLI configured, Docker installed
# ──────────────────────────────────────────────────────────────
set -euo pipefail

STACK_NAME="${1:-nexus-solo}"
DB_PASSWORD="${2:?Usage: $0 <stack-name> <db-password>}"
REGION="ap-south-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${STACK_NAME}-backend"

echo "╔════════════════════════════════════════════╗"
echo "║  Nexus Solo — AWS Deployment               ║"
echo "║  Stack:  ${STACK_NAME}"
echo "║  Region: ${REGION}"
echo "║  Account: ${ACCOUNT_ID}"
echo "╚════════════════════════════════════════════╝"

# ── Step 1: Deploy CloudFormation (creates ECR repo first) ──
echo ""
echo "▸ Step 1/5: Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file infra/template.yaml \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    DBMasterPassword="${DB_PASSWORD}" \
    ContainerImage="${ECR_URI}:latest" \
  --no-fail-on-empty-changeset

echo "  ✓ CloudFormation stack deployed"

# ── Step 2: Build & push backend Docker image ──
echo ""
echo "▸ Step 2/5: Building backend Docker image..."
docker build -t "${STACK_NAME}-backend:latest" .

echo "  Authenticating with ECR..."
aws ecr get-login-password --region "${REGION}" | \
  docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

docker tag "${STACK_NAME}-backend:latest" "${ECR_URI}:latest"
docker push "${ECR_URI}:latest"
echo "  ✓ Backend image pushed to ECR"

# ── Step 3: Update ECS service (force new deployment) ──
echo ""
echo "▸ Step 3/5: Updating ECS service..."
CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='ECSClusterName'].OutputValue" \
  --output text)

aws ecs update-service \
  --cluster "${CLUSTER_NAME}" \
  --service "${STACK_NAME}-backend" \
  --force-new-deployment \
  --region "${REGION}" > /dev/null

echo "  ✓ ECS service update triggered"

# ── Step 4: Build & upload frontend to S3 ──
echo ""
echo "▸ Step 4/5: Building and deploying frontend..."

ALB_URL=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='ALBURL'].OutputValue" \
  --output text)

CF_URL=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" \
  --output text)

BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

cd frontend
NEXT_PUBLIC_API_URL="${CF_URL}" NEXT_PUBLIC_API_KEY="nexus-prod-key-secure-2026" npm run build
aws s3 sync out/ "s3://${BUCKET_NAME}/" --delete --exclude "media/*" --region "${REGION}"
cd ..

echo "  ✓ Frontend deployed to S3"

# ── Step 5: Invalidate CloudFront cache ──
echo ""
echo "▸ Step 5/5: Invalidating CloudFront cache..."

CF_DIST_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[?Id=='S3Frontend']].Id" \
  --output text 2>/dev/null || true)

if [ -n "${CF_DIST_ID}" ]; then
  aws cloudfront create-invalidation \
    --distribution-id "${CF_DIST_ID}" \
    --paths "/*" > /dev/null
  echo "  ✓ CloudFront cache invalidated"
fi

# ── Done ──
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  ✅ Deployment Complete!                    ║"
echo "╠════════════════════════════════════════════╣"
echo "║  Backend API: ${ALB_URL}"
echo "║  Frontend:    ${CF_URL}"
echo "╚════════════════════════════════════════════╝"
