# Guide de déploiement production

*Rédigé le 2026-09-22. Le projet n'a encore jamais été déployé en production — ce document
part de ce qui existe réellement dans le dépôt (Dockerfiles, `docker-compose.yml` de dev),
vérifié en construisant les deux images de production en local (voir §7), pas d'une
plateforme déjà éprouvée. Adaptez l'hébergement à votre contexte ; le reste (secrets,
variables d'environnement, étapes) est directement actionnable.*

## 1. Ce qui existe déjà et ce qui manque

| | État |
|---|---|
| Image backend prête pour la prod | ✅ `backend/Dockerfile` (`APP_ENV=prod`, `composer install --no-dev`) |
| Image frontend prête pour la prod | ✅ `app/Dockerfile`, deuxième étage (nginx + build statique) — **jamais utilisée** par `docker-compose.yml`, qui s'arrête à l'étage `build` (dev, `npm run dev`) |
| Orchestration de prod (`docker-compose.prod.yml` ou équivalent) | ❌ absente — voir l'exemple §6 |
| HTTPS / reverse proxy | ❌ absent — `backend/nginx.conf` et `app/nginx.conf` écoutent en HTTP nu, pas de certificat |
| Sauvegardes de la base | ❌ absentes — le volume `db-data` n'est répliqué nulle part |
| Secrets de prod (APP_SECRET, JWT_PASSPHRASE, mot de passe DB) | ❌ à générer — ceux commités dans `.env`/`docker-compose.yml` sont des valeurs de dev connues de quiconque lit le dépôt |
| Premier compte administrateur en prod | ❌ à créer — les fixtures (qui créent `admin@example.com`) refusent de tourner en `APP_ENV=prod` depuis `AppFixtures::load()` (commit `8476c53`, délibéré — voir `communaute.md`) |
| Déploiement automatisé (CI → prod) | ❌ absent — `.github/workflows/ci.yml` ne fait que tester, aucune étape de déploiement |

## 2. Corrigé pendant la rédaction de ce guide

Écrire ce guide a fait remonter deux défauts concrets, corrigés dans ce commit :

- **`app/Dockerfile` gravait `VITE_API_URL=http://localhost:8000/api` en dur.** Vite grave
  cette variable dans le bundle JS **au build**, jamais au runtime — un déploiement réel
  aurait produit un site qui continue d'appeler `localhost:8000` chez chaque visiteur, en
  silence (pas d'erreur de démarrage, juste des requêtes API qui échouent dans le
  navigateur). La variable est maintenant un `ARG` : `docker build --build-arg
  VITE_API_URL=https://api.mondomaine.example/api …` (vérifié : l'URL personnalisée se
  retrouve bien dans le bundle construit, cf. §7).
- **Aucun `.dockerignore`** ni pour le backend ni pour le frontend : `COPY . .` embarquait
  potentiellement `.git/`, un `.env.local` local, `var/cache` de dev, etc. dans l'image.
  Ajoutés (`backend/.dockerignore`, `app/.dockerignore`).

## 3. Variables d'environnement à changer avant toute mise en prod

**Ne jamais réutiliser les valeurs de `backend/.env` ou `docker-compose.yml` telles
quelles en prod : ce sont des valeurs de développement, lisibles par quiconque a accès au
dépôt.**

| Variable | Valeur de dev (à ne pas réutiliser) | En prod |
|---|---|---|
| `APP_ENV` | `dev` | `prod` (déjà posé par `backend/Dockerfile`, ne pas le surcharger) |
| `APP_SECRET` | `5a79a1d82b3d6e5c8f9e0a1b2c3d4e5f` (dans `docker-compose.yml`) | Générer : `openssl rand -hex 16` |
| `DATABASE_URL` | pointe vers un mot de passe `!ChangeMe!` | DSN Postgres réel, mot de passe fort dédié à cet environnement |
| `JWT_PASSPHRASE` | valeur commitée dans `backend/.env` | Générer une passphrase forte ; régénérer aussi le keypair (`lexik:jwt:generate-keypair`) — ne **jamais** réutiliser les clés de dev |
| `CORS_ALLOW_ORIGIN` | `^https?://(localhost\|127\.0\.0\.1)(:[0-9]+)?$` | Regex (ou liste) couvrant le(s) vrai(s) domaine(s) du frontend, en HTTPS uniquement |
| `FRONTEND_URL` | `http://localhost:5173` | URL publique réelle du frontend (utilisée dans les liens des e-mails : réinitialisation de mot de passe, confirmation d'adresse) |
| `MAILER_DSN` | `null://null` en dev nu, `smtp://mailpit:1025` sous docker-compose | DSN d'un vrai fournisseur SMTP/API (Symfony Mailer supporte SES, Mailgun, Postmark, Brevo, SMTP générique…) |
| `MAILER_FROM` | `no-reply@chroniques-oubliees.local` | Adresse d'expédition réelle, sur un domaine dont le SPF/DKIM est configuré (sinon les e-mails de confirmation/réinitialisation finissent en spam) |
| `RATE_LIMIT_ENABLED` | `false` (désactivé pour dev/e2e dans `docker-compose.yml`) | **`true`** (ou l'omettre : `true` est le défaut de `.env`) |
| `EMAIL_VERIFICATION_REQUIRED` | `false` (désactivé pour dev/e2e) | **`true`** (ou l'omettre) — sans quoi n'importe qui s'inscrit avec une adresse jamais vérifiée |
| `SEED_ADMIN_PASSWORD` / `SEED_NAUNO_PASSWORD` / `SEED_DEMO_PASSWORD` | `admin` / `chroniques` / `password` | Sans effet en prod (les fixtures refusent de tourner), mais à ne pas surcharger avec un vrai secret par réflexe — ces variables n'ont aucun rôle hors dev |
| `VITE_API_URL` (build-arg frontend) | `http://localhost:8000/api` | URL publique réelle de l'API, **passée au build** (`docker build --build-arg`), pas modifiable après coup sans reconstruire l'image |

## 4. HTTPS

Ni `backend/nginx.conf` ni `app/nginx.conf` ne terminent de TLS — les deux écoutent en HTTP
nu, pensés pour être placés derrière quelque chose qui gère les certificats. Deux options
courantes, aucune déjà câblée dans le dépôt :

- **Reverse proxy dédié** (Caddy ou Traefik) devant les conteneurs `frontend` et `backend` :
  Caddy en particulier obtient et renouvelle les certificats Let's Encrypt automatiquement
  avec une configuration minimale (un `Caddyfile` de quelques lignes par domaine).
- **TLS géré par la plateforme d'hébergement**, si vous déployez sur une offre qui
  termine le HTTPS pour vous (load balancer managé, PaaS) — dans ce cas les conteneurs du
  dépôt restent inchangés, exposés en HTTP en interne.

Dans les deux cas, `CORS_ALLOW_ORIGIN` doit couvrir le domaine HTTPS final, et
`FRONTEND_URL`/`VITE_API_URL` doivent être en `https://`.

## 5. Base de données et sauvegardes

Le volume nommé `db-data` (déclaré dans `docker-compose.yml`) n'est répliqué ni sauvegardé
nulle part — perdre le volume perd toutes les données utilisateur (comptes, campagnes,
personnages, contenu communautaire). Avant d'accepter du trafic réel :

- Sauvegarde régulière : `pg_dump` planifié (cron dans un conteneur dédié, ou fonctionnalité
  native si vous passez par un Postgres managé plutôt que le conteneur `postgres:15-alpine`
  du dépôt) ;
- Tester la restauration au moins une fois — une sauvegarde jamais restaurée n'est pas une
  sauvegarde ;
- Si vous restez sur le conteneur Postgres du dépôt, monter `db-data` sur un disque
  lui-même sauvegardé au niveau infra (snapshot du volume), en plus des dumps logiques.

## 6. Exemple d'orchestration de prod

Aucun `docker-compose.prod.yml` n'existe dans le dépôt — en voici un exemple de départ,
**non testé en conditions réelles** (aucun hébergement/domaine disponible pour ce faire),
mais construit à partir des deux Dockerfiles vérifiés (§7). Il suppose un reverse proxy
externe (Caddy/Traefik/autre) qui route déjà `example.com` → `frontend:80` et
`api.example.com` → `backend-nginx:80`, et que les secrets viennent d'un fichier
`.env.prod` non commité :

```yaml
services:
  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: "${DB_PASSWORD}"
    volumes:
      - db-data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: "postgresql://app:${DB_PASSWORD}@database:5432/app?serverVersion=15&charset=utf8"
      APP_SECRET: "${APP_SECRET}"
      JWT_PASSPHRASE: "${JWT_PASSPHRASE}"
      CORS_ALLOW_ORIGIN: "^https://example\\.com$$"
      FRONTEND_URL: "https://example.com"
      MAILER_DSN: "${MAILER_DSN}"
      MAILER_FROM: "no-reply@example.com"
      RATE_LIMIT_ENABLED: "true"
      EMAIL_VERIFICATION_REQUIRED: "true"
    volumes:
      - jwt-keys:/app/config/jwt   # généré une fois, jamais reconstruit avec l'image
    depends_on: [database]
    restart: unless-stopped

  backend-nginx:
    image: nginx:alpine
    volumes:
      - ./backend/public:/app/public:ro
      - ./backend/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on: [backend]
    restart: unless-stopped

  frontend:
    build:
      context: ./app
      dockerfile: Dockerfile
      args:
        VITE_API_URL: "https://api.example.com/api"
    restart: unless-stopped

volumes:
  db-data:
  jwt-keys:
```

Points volontairement laissés à votre discrétion : ports exposés (dépend du reverse proxy
choisi), registre d'images le cas échéant, orchestrateur (Compose seul suffit pour un
volume modeste ; au-delà, Swarm/Kubernetes sortent du cadre de ce dépôt).

## 7. Vérifié en local (2026-09-22)

Les deux images ont été construites pour de vrai (pas seulement lues) :

```bash
docker build -t cof-backend-prod ./backend
# → construit sans erreur ; assets:install / importmap:install / cache:clear
#   tournent automatiquement pendant le build (script post-install de Composer)

docker build --build-arg VITE_API_URL=https://api.exemple.test/api -t cof-frontend-prod ./app
# → construit sans erreur ; l'URL personnalisée est bien gravée dans le bundle
#   (vérifié : `grep` la retrouve dans le JS compilé)
```

Tailles obtenues : ~387 Mo (backend, php-fpm-alpine + vendor complet), ~135 Mo (frontend,
nginx-alpine + build statique). Le build backend nécessite un accès sortant à
`cdn.jsdelivr.net` (téléchargement de `@hotwired/stimulus`/`@hotwired/turbo` par
`importmap:install`) — à prévoir si l'environnement de build est isolé du réseau.

## 8. Étapes de déploiement (checklist)

1. Générer tous les secrets de prod (§3), les stocker dans un gestionnaire de secrets ou un
   `.env.prod` **non commité**.
2. Construire les images (`docker build`, avec le bon `VITE_API_URL` côté frontend).
3. Démarrer `database` seule, attendre qu'elle réponde.
4. Démarrer `backend`, puis à l'intérieur : `bin/console doctrine:migrations:migrate
   --no-interaction`.
5. Générer le keypair JWT **une seule fois**, sur un volume qui survit aux redéploiements
   (`bin/console lexik:jwt:generate-keypair`) — le régénérer invaliderait tous les tokens
   déjà émis.
6. Créer le premier compte administrateur réel — les fixtures refusent de tourner en prod,
   donc pas de seed automatique. Deux options : s'inscrire normalement via le site (avec
   vérification d'e-mail active) puis promouvoir ce compte en `ROLE_ADMIN` par une requête
   SQL directe (`UPDATE "user" SET roles = '["ROLE_ADMIN"]' WHERE email = '...'`) ; ou
   `bin/console app:create-test-user --email=... --password=... --role=ROLE_ADMIN --force`
   avec un e-mail et un mot de passe réels et forts (le `--force` est nécessaire, cf.
   `CreateTestUserCommand` — la commande refuse `APP_ENV=prod` par défaut).
7. Démarrer `backend-nginx` et `frontend`.
8. Brancher le reverse proxy / DNS / certificats (§4).
9. Smoke-test : inscription réelle (l'e-mail de confirmation part-il ?), connexion,
   chargement du compendium, back-office accessible uniquement à l'admin créé en (6).
10. Mettre en place la sauvegarde de la base (§5) avant d'accepter du trafic réel.

## 9. Ce qui reste hors de ce guide

- **Déploiement automatisé** (CI qui construit et pousse les images, puis déclenche le
  déploiement) : `.github/workflows/ci.yml` ne fait aujourd'hui que tester. À construire
  une fois l'hébergement choisi — la étape dépend trop de la plateforme pour l'anticiper ici.
- **Observabilité** (logs centralisés, alerting, métriques) : rien de spécifique au projet
  au-delà des logs Symfony/nginx par défaut.
- **Scaling** (plusieurs instances backend derrière un load balancer) : `RateLimitSubscriber`
  utilise `cache.app` (filesystem par défaut) comme compteur — au-delà d'une seule instance
  backend, il faudrait un adaptateur de cache partagé (Redis) pour que la limite de débit
  reste correcte entre instances.
