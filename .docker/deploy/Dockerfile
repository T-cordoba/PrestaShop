# Self-contained image of the V&V branch for a public deployment (Railway): code, vendor and built assets baked in.
# Build context: the installed tree streamed from the dev container (see README.md in this folder).
FROM prestashop/base:8.1-apache

COPY --chown=www-data:www-data . /var/www/html
COPY --chown=www-data:www-data .docker/deploy/parameters.php /var/www/html/app/config/parameters.php

RUN sed -i "s/define('_PS_MODE_DEV_', true);/define('_PS_MODE_DEV_', false);/" /var/www/html/config/defines.inc.php \
    && rm -rf /var/www/html/var/cache/* /var/www/html/var/logs/* \
    && chmod 755 /var/www/html/.docker/deploy/start.sh

CMD ["/var/www/html/.docker/deploy/start.sh"]
