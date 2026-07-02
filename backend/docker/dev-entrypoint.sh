#!/bin/sh
set -e

# Attendre que Postgres réponde avant toute commande console
until php bin/console dbal:run-sql "SELECT 1" >/dev/null 2>&1; do
  echo "En attente de la base de données..."
  sleep 1
done

# Appliquer les migrations
php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration

# Créer/actualiser l'utilisateur de test uniquement en dev
if [ "$APP_ENV" = "dev" ]; then
  php bin/console app:create-test-user
fi

exec php-fpm
