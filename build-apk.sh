#!/bin/bash

# Group Management System - APK Build Script
# This script builds an APK for the Group Management System

echo "🚀 Building Group Management System APK..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

# Login to EAS (if not already logged in)
echo "🔐 Checking EAS authentication..."
if ! eas whoami &> /dev/null; then
    echo "Please log in to EAS:"
    eas login
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf build/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check for environment variables
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Please create one with your Supabase credentials."
    echo "Required variables:"
    echo "EXPO_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
    echo "EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_key"
fi

# Build APK using EAS
echo "🔨 Building APK with EAS..."
eas build --platform android --profile preview --local

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ APK build completed successfully!"
    echo "📱 APK location: Check the EAS build output for the APK file location"
    echo "📋 Build details:"
    echo "   - Platform: Android"
    echo "   - Build Type: APK"
    echo "   - Profile: Preview"
else
    echo "❌ APK build failed. Check the error messages above."
    exit 1
fi

echo "🎉 Build process completed!"
