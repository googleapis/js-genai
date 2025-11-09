#!/bin/bash
# Quick publish script for @githubmann/google-genai

set -e

echo "🚀 Publishing @githubmann/google-genai to npm"
echo ""

# Check if logged in
echo "📋 Checking npm login status..."
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ Not logged in to npm"
    echo "Please run: npm login"
    exit 1
fi

echo "✅ Logged in as: $(npm whoami)"
echo ""

# Show package info
echo "📦 Package information:"
echo "   Name: $(node -p "require('./package.json').name")"
echo "   Version: $(node -p "require('./package.json').version")"
echo ""

# Dry run
echo "🔍 Running dry-run to see what will be published..."
npm pack --dry-run
echo ""

# Confirm
read -p "Do you want to publish this package? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publish cancelled"
    exit 1
fi

# Build
echo "🔨 Building production version..."
npm run build-prod

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Publish
echo "📤 Publishing to npm..."
npm publish --access public

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully published!"
    echo ""
    echo "📍 View at: https://www.npmjs.com/package/@githubmann/google-genai"
    echo ""
    echo "🎉 Users can now install with:"
    echo "   npm install @githubmann/google-genai"
else
    echo "❌ Publish failed"
    exit 1
fi
