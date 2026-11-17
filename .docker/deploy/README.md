# Public deployment (Railway)

Self-contained image of `vv/final-project` for the V&V course: code, `vendor/` and built assets are baked in, secrets
are not.

1. Build from the installed dev container (it holds `vendor/` and the compiled assets):
   `docker exec -w /var/www/html prestashop-prestashop-git-1 tar cf - --exclude=./.git --exclude=node_modules --exclude=./var/cache --exclude=./var/logs --exclude=./tests --exclude=./docs --exclude=./.docker/ssl.key --exclude=./.docker/ssl.crt --exclude=./app/config/parameters.php --exclude=./install-dev . | docker build -t ghcr.io/t-cordoba/prestashop-vv:deploy -f .docker/deploy/Dockerfile -`
2. Push it to GHCR (public package) and run it on Railway next to a MySQL service with:
   `PORT=8080`, `MYSQLHOST/MYSQLPORT/MYSQLDATABASE/MYSQLUSER/MYSQLPASSWORD` referencing the MySQL service, and
   `PS_PARAMETERS_B64` = base64 JSON of the installed `app/config/parameters.php` parameters.
3. Import a dump of the local database and point `PS_SHOP_DOMAIN`, `PS_SHOP_DOMAIN_SSL` and `ps_shop_url` to the
   Railway domain with `PS_SSL_ENABLED=1`.
