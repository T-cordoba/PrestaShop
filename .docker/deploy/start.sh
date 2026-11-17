#!/bin/sh
set -e
# Railway's runtime can end up with several MPMs enabled; mod_php needs prefork only.
rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.*
a2enmod -q mpm_prefork >/dev/null
# TLS ends at Railway's proxy: expose it to PHP so PrestaShop and Symfony see a secure request.
echo 'SetEnvIf X-Forwarded-Proto "^https$" HTTPS=on' > /etc/apache2/conf-enabled/forwarded-https.conf
# Railway sets PORT; Apache listens on it so the generated domain reaches the container.
if [ -n "$PORT" ]; then
  sed -i "s/^Listen .*/Listen $PORT/" /etc/apache2/ports.conf
  sed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost *:$PORT>/" /etc/apache2/sites-available/000-default.conf
fi
exec apache2-foreground
