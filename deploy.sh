#!/bin/bash

# Voice Airline Booking - Production Deployment Script
# Usage: ./deploy.sh [SERVER_IP] [SSH_USER]

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Voice Airline Booking - Production Deployment${NC}"
echo "=================================================="

# Check if server IP provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Server IP required${NC}"
    echo "Usage: ./deploy.sh SERVER_IP [SSH_USER]"
    echo "Example: ./deploy.sh 192.168.1.100 root"
    exit 1
fi

SERVER_IP=$1
SSH_USER=${2:-root}
REMOTE_DIR="/root/voice-airline-booking"

echo -e "${GREEN}📦 Step 1: Creating deployment package...${NC}"
# Create tar archive excluding unnecessary files
tar -czf voice-airline-deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='dist' \
    --exclude='build' \
    backend/ frontend/ nlp-service/ \
    docker-compose.prod.yml \
    *.md

echo -e "${GREEN}📤 Step 2: Uploading to server...${NC}"
scp voice-airline-deploy.tar.gz ${SSH_USER}@${SERVER_IP}:/tmp/

echo -e "${GREEN}🔧 Step 3: Installing on server...${NC}"
ssh ${SSH_USER}@${SERVER_IP} << 'ENDSSH'
    set -e
    
    echo "Creating directory..."
    mkdir -p /root/voice-airline-booking
    cd /root/voice-airline-booking
    
    echo "Extracting files..."
    tar -xzf /tmp/voice-airline-deploy.tar.gz
    rm /tmp/voice-airline-deploy.tar.gz
    
    echo "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    echo "Stopping old containers..."
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    echo "Building and starting containers..."
    docker-compose -f docker-compose.prod.yml up -d --build
    
    echo "Waiting for services to start..."
    sleep 10
    
    echo "Container status:"
    docker-compose -f docker-compose.prod.yml ps
ENDSSH

# Cleanup
rm voice-airline-deploy.tar.gz

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=================================================="
echo -e "${BLUE}🌐 Application URL:${NC} http://${SERVER_IP}"
echo -e "${BLUE}📊 Check status:${NC} ssh ${SSH_USER}@${SERVER_IP} 'docker-compose -f ${REMOTE_DIR}/docker-compose.prod.yml ps'"
echo -e "${BLUE}📋 View logs:${NC} ssh ${SSH_USER}@${SERVER_IP} 'docker-compose -f ${REMOTE_DIR}/docker-compose.prod.yml logs -f'"
echo ""
echo -e "${GREEN}🎉 Your voice booking system is now live!${NC}"
