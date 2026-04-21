#!/bin/bash

set -e

echo ""
echo "🚀 Invoicio Setup Script"
echo "========================"
echo ""

# Check Node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is required. Install from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required. You have $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install deps
echo ""
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Setup env
if [ ! -f .env.local ]; then
  echo ""
  echo "🔑 Setting up environment variables..."
  cp .env.local.example .env.local
  echo ""
  echo "⚠️  Please edit .env.local and add your Supabase credentials:"
  echo "   NEXT_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co"
  echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
  echo ""
  read -p "Press Enter once you've updated .env.local..."
fi

echo ""
echo "🏗️  Running build check..."
npm run build

echo ""
echo "✅ All good! Start the dev server with:"
echo "   npm run dev"
echo ""
echo "   Then open http://localhost:3000"
echo ""
