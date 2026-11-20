FROM dunglas/frankenphp:1-php8.4-alpine
WORKDIR /app
RUN apk add --no-cache xz \
 && cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
 && install-php-extensions pdo_pgsql curl fileinfo mbstring dom
COPY .payload /tmp/cd-payload
COPY Caddyfile /etc/caddy/Caddyfile
COPY php.ini /usr/local/etc/php/conf.d/99-cafe-danesh.ini
RUN cat /tmp/cd-payload/part-01.b64 \
    /tmp/cd-payload/part-02-01.b64 /tmp/cd-payload/part-02-02.b64 \
    /tmp/cd-payload/part-02-03.b64 /tmp/cd-payload/part-02-04.b64 \
    /tmp/cd-payload/part-02-05.b64 /tmp/cd-payload/part-02-06.b64 \
    /tmp/cd-payload/part-02-07.b64 /tmp/cd-payload/part-02-08.b64 \
    /tmp/cd-payload/part-03.b64 /tmp/cd-payload/part-04.b64 \
    /tmp/cd-payload/part-05.b64 /tmp/cd-payload/part-06.b64 \
    /tmp/cd-payload/part-07.b64 /tmp/cd-payload/part-08.b64 \
    /tmp/cd-payload/part-09.b64 /tmp/cd-payload/part-10.b64 \
    /tmp/cd-payload/part-11.b64 /tmp/cd-payload/part-12.b64 \
    /tmp/cd-payload/part-13.b64 /tmp/cd-payload/part-14.b64 \
    /tmp/cd-payload/part-15.b64 /tmp/cd-payload/part-16.b64 \
 | base64 -d | xz -dc | tar -x -C /app \
 && rm -rf /tmp/cd-payload \
 && test -f /app/public/index.php \
 && test -f /app/app/db.php \
 && php -l /app/public/index.php
ENV PORT=80
EXPOSE 80
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
