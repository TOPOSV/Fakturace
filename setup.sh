#!/bin/bash

# Fakturace - Setup Script
# This script helps set up the development environment

set -e

echo "=================================="
echo "Fakturace - Development Setup"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 18 or higher from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js version 18 or higher is required${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js $(node -v) is installed"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}Warning: PostgreSQL is not installed${NC}"
    echo "Please install PostgreSQL 14 or higher"
    echo "Ubuntu/Debian: sudo apt install postgresql"
    echo "macOS: brew install postgresql"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} PostgreSQL is installed"
fi

echo ""
echo "Step 1: Backend Setup"
echo "====================="

cd backend

# Install backend dependencies
echo "Installing backend dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    
    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Update .env with generated secret (cross-platform compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|JWT_SECRET=\".*\"|JWT_SECRET=\"$JWT_SECRET\"|" .env
    else
        # Linux
        sed -i "s|JWT_SECRET=\".*\"|JWT_SECRET=\"$JWT_SECRET\"|" .env
    fi
    
    echo -e "${YELLOW}Please update the .env file with your database credentials${NC}"
    echo "Database URL format: postgresql://user:password@localhost:5432/fakturace"
    
    read -p "Press Enter when ready to continue..."
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Ask about database migration
echo ""
read -p "Do you want to run database migrations now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running database migrations..."
    npx prisma migrate dev --name init
    echo -e "${GREEN}✓${NC} Database migrations completed"
fi

cd ..

echo ""
echo "Step 2: Frontend Setup"
echo "======================"

cd frontend

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    cp .env.example .env.local
    echo -e "${GREEN}✓${NC} Frontend environment configured"
fi

cd ..

echo ""
echo "=================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=================================="
echo ""
echo "To start the application:"
echo ""
echo "Backend:"
echo "  cd backend"
echo "  npm run start:dev"
echo ""
echo "Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
echo "For more information, see:"
echo "  - README.md for general overview"
echo "  - DEVELOPMENT.md for development guide"
echo "  - DEPLOYMENT.md for production deployment"
echo "  - backend/API.md for API documentation"
echo ""
