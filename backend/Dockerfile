FROM php:8.3-fpm-alpine

# Install dependencies
RUN apk add --no-cache \
    acl \
    file \
    gettext \
    git \
    icu-dev \
    libpq-dev \
    libzip-dev \
    unzip \
    zip

# Install PHP extensions
RUN docker-php-ext-install \
    intl \
    pdo_pgsql \
    zip \
    opcache

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy files
COPY . .

# Set production environment
ENV APP_ENV=prod

# Permissions
RUN set -eux; \
    mkdir -p var/cache var/log; \
    composer install --prefer-dist --no-dev --no-scripts --no-progress; \
    composer dump-autoload --classmap-authoritative --no-dev; \
    composer run-script --no-dev post-install-cmd; \
    chmod +x bin/console; sync

EXPOSE 9000
CMD ["php-fpm"]
