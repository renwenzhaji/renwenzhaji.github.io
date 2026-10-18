#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get install -y nodejs curl >/dev/null 2>&1 || { apt-get update -y >/dev/null 2>&1; apt-get install -y nodejs curl >/dev/null 2>&1; }
mkdir -p /opt/rwzj-api /var/lib/rwzj /var/www/admin
curl -fsSL -o /opt/rwzj-api/server.js https://renwenzhaji.cn/tools/api-server.js
curl -fsSL -o /var/www/admin/index.html https://renwenzhaji.cn/tools/admin.html
[ -s /var/lib/rwzj/messages.json ] || echo '[]' > /var/lib/rwzj/messages.json
chown -R www-data:www-data /var/lib/rwzj /var/www/admin
printf '[Unit]\nDescription=rwzj api\nAfter=network.target\n\n[Service]\nType=simple\nUser=www-data\nGroup=www-data\nExecStart=/usr/bin/env node /opt/rwzj-api/server.js\nRestart=always\n\n[Install]\nWantedBy=multi-user.target\n' > /etc/systemd/system/rwzj-api.service
systemctl daemon-reload
systemctl enable rwzj-api >/dev/null 2>&1 || true
systemctl restart rwzj-api
printf 'server {\n listen 80 default_server;\n server_name _;\n root /var/www/rwzj;\n index index.html;\n location /admin/ { alias /var/www/admin/; index index.html; }\n location /api/ { proxy_pass http://127.0.0.1:8081/; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $remote_addr; }\n location / { try_files $uri $uri/ =404; }\n}\n' > /etc/nginx/sites-available/rwzj
nginx -t
systemctl reload nginx
sleep 1
curl -fsS http://127.0.0.1:8081/list >/dev/null && echo API_OK
