#!/bin/bash

# Deployment Script for Group Management System
# This script deploys the app to app stores

set -e

echo "🚀 Starting deployment process..."

# Check if required environment variables are set
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: EXPO_PUBLIC_SUPABASE_URL is not set"
    exit 1
fi

if [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: EXPO_PUBLIC_SUPABASE_ANON_KEY is not set"
    exit 1
fi

if [ -z "$EXPO_PUBLIC_PROJECT_ID" ]; then
    echo "❌ Error: EXPO_PUBLIC_PROJECT_ID is not set"
    exit 1
fi

echo "✅ Environment variables validated"

# Build the app
echo "🔨 Building app for production..."
eas build --platform all --profile production --non-interactive

# Submit to App Store (iOS)
echo "🍎 Submitting to App Store..."
eas submit --platform ios --profile production --non-interactive

# Submit to Google Play Store (Android)
echo "🤖 Submitting to Google Play Store..."
eas submit --platform android --profile production --non-interactive

echo "✅ Deployment completed successfully!"
echo "📱 Check the app stores for submission status"

# Deployment Script for Group Management System
# This script deploys the app to app stores

set -e

echo "🚀 Starting deployment process..."

# Check if required environment variables are set
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: EXPO_PUBLIC_SUPABASE_URL is not set"
    exit 1
fi

if [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: EXPO_PUBLIC_SUPABASE_ANON_KEY is not set"
    exit 1
fi

if [ -z "$EXPO_PUBLIC_PROJECT_ID" ]; then
    echo "❌ Error: EXPO_PUBLIC_PROJECT_ID is not set"
    exit 1
fi

echo "✅ Environment variables validated"

# Build the app
echo "🔨 Building app for production..."
eas build --platform all --profile production --non-interactive

# Submit to App Store (iOS)
echo "🍎 Submitting to App Store..."
eas submit --platform ios --profile production --non-interactive

# Submit to Google Play Store (Android)
echo "🤖 Submitting to Google Play Store..."
eas submit --platform android --profile production --non-interactive

echo "✅ Deployment completed successfully!"
echo "📱 Check the app stores for submission status"
