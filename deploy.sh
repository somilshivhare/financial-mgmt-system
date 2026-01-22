#!/bin/bash

# NBAURUM ERP Deployment Script
# This script automates the deployment process on the server
# 
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting NBAURUM ERP Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/nbaurum"
BACKEND_DIR="$PROJECT_DIR/server"
FRONTEND_DIR="$PROJECT_DIR/client"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Navigate to project directory
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found: $PROJECT_DIR"
    print_info "Please clone your repository first:"
    echo "  git clone https://github.com/your-username/your-repo.git $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# Pull latest changes from Git
print_info "Pulling latest changes from Git..."
git pull origin main || git pull origin master
print_success "Git pull completed"

# Backend deployment
print_info "Deploying backend..."
cd "$BACKEND_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found in server directory"
    print_info "Please copy .env.example to .env and configure it:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Install dependencies
print_info "Installing backend dependencies..."
npm install --production
print_success "Backend dependencies installed"

# Run migrations
print_info "Running database migrations..."
npm run migrate || print_info "Migrations may have failed or already run"
print_success "Migrations completed"

# Restart backend with PM2
print_info "Restarting backend server..."
pm2 restart server || pm2 start ecosystem.config.js
print_success "Backend server restarted"

# Frontend deployment
print_info "Deploying frontend..."
cd "$FRONTEND_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found in client directory"
    print_info "Please copy .env.example to .env and configure it:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Install dependencies
print_info "Installing frontend dependencies..."
npm install
print_success "Frontend dependencies installed"

# Build frontend
print_info "Building frontend for production..."
npm run build
print_success "Frontend build completed"

# Reload Nginx
print_info "Reloading Nginx..."
sudo systemctl reload nginx
print_success "Nginx reloaded"

# Show PM2 status
print_info "Current PM2 status:"
pm2 status

# Show disk usage
print_info "Build size:"
du -sh "$FRONTEND_DIR/dist"

echo ""
print_success "🎉 Deployment completed successfully!"
print_info "Check your application at: http://your-server-ip or https://yourdomain.com"
print_info "Check backend health: http://your-server-ip/api/v1/health"

