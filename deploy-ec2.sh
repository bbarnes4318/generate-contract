#!/bin/bash
set -e

# Move SPA files
cp -r /tmp/dist/* /var/www/sign.pvnvoice.com/

# Setup API
cp /tmp/server.js /opt/ppc-io-api/
cp /tmp/send-email.js /opt/ppc-io-api/

cd /opt/ppc-io-api
cat > package.json << 'EOF'
{
  "name": "ppc-io-api",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5"
  }
}
EOF
npm install

# Start API with PM2
pm2 start server.js --name ppc-io-api
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | bash

# Configure Nginx
cat > /etc/nginx/sites-available/sign.pvnvoice.com << 'NGINX'
server {
    listen 80;
    server_name sign.pvnvoice.com;
    root /var/www/sign.pvnvoice.com;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Express
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
}
NGINX

# Enable site
ln -sf /etc/nginx/sites-available/sign.pvnvoice.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== DEPLOYMENT COMPLETE ==="
echo "SPA: http://98.95.177.113"
echo "API: http://98.95.177.113/api/send-email"
