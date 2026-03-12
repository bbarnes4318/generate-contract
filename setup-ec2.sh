#!/bin/bash
set -e

echo "=== PPC IO App Setup on AWS EC2 ==="

# Update system
apt-get update -y
apt-get upgrade -y

# Install Nginx
apt-get install -y nginx

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Create app directories
mkdir -p /var/www/sign.pvnvoice.com
mkdir -p /opt/ppc-io-api

# Install Certbot for SSL
apt-get install -y certbot python3-certbot-nginx

echo "=== Base setup complete ==="
