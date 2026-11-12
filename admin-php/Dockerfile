FROM dunglas/frankenphp:1-php8.4-alpine
RUN install-php-extensions pdo_pgsql mbstring curl
WORKDIR /app
COPY . /app
COPY Caddyfile /etc/frankenphp/Caddyfile
COPY php.ini /usr/local/etc/php/conf.d/99-cafe-danesh.ini
EXPOSE 8080
CMD ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile"]
