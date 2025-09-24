#!/bin/bash

# Production Build Script for Group Management System
# This script builds the app for production deployment

set -e

echo "🚀 Starting production build process..."

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

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting
echo "🔍 Running linting..."
npm run lint

# Run type checking
echo "🔍 Running type checking..."
npx tsc --noEmit

# Build for iOS
echo "🍎 Building for iOS..."
eas build --platform ios --profile production --non-interactive

# Build for Android
echo "🤖 Building for Android..."
eas build --platform android --profile production --non-interactive

echo "✅ Production build completed successfully!"
echo "📱 Check the EAS dashboard for build status and download links"

# Production Build Script for Group Management System
# This script builds the app for production deployment

set -e

echo "🚀 Starting production build process..."

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

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting
echo "🔍 Running linting..."
npm run lint

# Run type checking
echo "🔍 Running type checking..."
npx tsc --noEmit

# Build for iOS
echo "🍎 Building for iOS..."
eas build --platform ios --profile production --non-interactive

# Build for Android
echo "🤖 Building for Android..."
eas build --platform android --profile production --non-interactive

echo "✅ Production build completed successfully!"
echo "📱 Check the EAS dashboard for build status and download links"
