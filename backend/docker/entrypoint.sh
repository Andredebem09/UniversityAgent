#!/bin/bash
set -e

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache

if [ -z "$1" ] || [ "$1" = "apache2-foreground" ]; then
    php artisan migrate --path=vendor/laravel/sanctum/database/migrations --force
    php artisan migrate --force
    exec apache2-foreground
else
    exec "$@"
fi
