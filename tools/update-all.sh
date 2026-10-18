#!/bin/bash
set -e
curl -fsSL -o /opt/rwzj-api/server.js https://renwenzhaji.cn/tools/api-server.js
systemctl restart rwzj-api
curl -fsSL https://codeload.github.com/renwenzhaji/renwenzhaji.github.io/zip/refs/heads/main -o /tmp/rwzj.zip
rm -rf /tmp/rwzjsrc /var/www/rwzj
mkdir -p /var/www/rwzj
unzip -oq /tmp/rwzj.zip -d /tmp/rwzjsrc
cp -a /tmp/rwzjsrc/*/. /var/www/rwzj/
chown -R www-data:www-data /var/www/rwzj
systemctl reload nginx || true
echo UPDATE_OK
