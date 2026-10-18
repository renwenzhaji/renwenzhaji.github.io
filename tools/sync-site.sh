#!/bin/bash
set -e
curl -fsSL https://codeload.github.com/renwenzhaji/renwenzhaji.github.io/zip/refs/heads/main -o /tmp/rwzj.zip
rm -rf /tmp/rwzjsrc /var/www/rwzj
mkdir -p /var/www/rwzj
unzip -oq /tmp/rwzj.zip -d /tmp/rwzjsrc
cp -a /tmp/rwzjsrc/*/. /var/www/rwzj/
chown -R www-data:www-data /var/www/rwzj
echo SYNC_OK
