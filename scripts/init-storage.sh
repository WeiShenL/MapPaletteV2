#!/bin/sh
# Storage Bucket Initialization Script
# This script creates the required storage buckets via the Supabase Storage API
# Runs after the storage service is healthy

set -e

STORAGE_URL="${STORAGE_URL:-http://supabase-storage:5000}"
SERVICE_KEY="${SUPABASE_SERVICE_KEY}"

echo "Waiting for storage service to be ready..."
sleep 5

# Function to create a bucket
create_bucket() {
  BUCKET_ID="$1"
  BUCKET_PUBLIC="$2"
  FILE_SIZE_LIMIT="$3"
  
  echo "Creating bucket: $BUCKET_ID"
  
  # Check if bucket exists
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    "${STORAGE_URL}/bucket/${BUCKET_ID}")
  
  if [ "$RESPONSE" = "200" ]; then
    echo "Bucket $BUCKET_ID already exists"
    return 0
  fi
  
  # Create the bucket
  curl -s -X POST \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"${BUCKET_ID}\",\"name\":\"${BUCKET_ID}\",\"public\":${BUCKET_PUBLIC},\"file_size_limit\":${FILE_SIZE_LIMIT}}" \
    "${STORAGE_URL}/bucket"
  
  echo "Bucket $BUCKET_ID created"
}

# Create buckets
# profile-pictures: public, 5MB limit
create_bucket "profile-pictures" "true" "5242880"

# route-images: public, 10MB limit
create_bucket "route-images" "true" "10485760"

# route-images-optimized: public, 10MB limit
create_bucket "route-images-optimized" "true" "10485760"

echo "Storage initialization complete!"
