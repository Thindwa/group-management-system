#!/bin/bash

# Production Setup Script for Group Management System
# This script sets up the production environment

set -e

echo "🚀 Setting up production environment..."

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g @expo/eas-cli
fi

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI..."
    npm install -g @expo/cli
fi

# Login to Expo
echo "🔐 Logging in to Expo..."
eas login

# Configure EAS project
echo "⚙️ Configuring EAS project..."
eas project:init

# Create production build profile
echo "📝 Creating production build profile..."
cat > eas.json << EOF
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account-key.json",
        "track": "internal"
      }
    }
  }
}
EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run setup commands
echo "🔧 Running setup commands..."
npm run setup

echo "✅ Production environment setup completed!"
echo "📝 Next steps:"
echo "1. Update eas.json with your Apple ID and Google Play credentials"
echo "2. Set up your Supabase project"
echo "3. Configure environment variables"
echo "4. Run 'npm run build:production' to build the app"

# Production Setup Script for Group Management System
# This script sets up the production environment

set -e

echo "🚀 Setting up production environment..."

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g @expo/eas-cli
fi

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI..."
    npm install -g @expo/cli
fi

# Login to Expo
echo "🔐 Logging in to Expo..."
eas login

# Configure EAS project
echo "⚙️ Configuring EAS project..."
eas project:init

# Create production build profile
echo "📝 Creating production build profile..."
cat > eas.json << EOF
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account-key.json",
        "track": "internal"
      }
    }
  }
}
EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run setup commands
echo "🔧 Running setup commands..."
npm run setup

echo "✅ Production environment setup completed!"
echo "📝 Next steps:"
echo "1. Update eas.json with your Apple ID and Google Play credentials"
echo "2. Set up your Supabase project"
echo "3. Configure environment variables"
echo "4. Run 'npm run build:production' to build the app"
