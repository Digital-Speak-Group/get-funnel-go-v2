# 🚀 Guide de Déploiement Multi-Projets sur VPS (Digital Speak)

> **Info pour l'équipe :** Notre serveur VPS est **déjà configuré** de base. Il contient déjà Docker, l'utilisateur `runner`, et un Reverse Proxy (Nginx). Vous n'avez pas besoin de configurer le serveur à zéro.
> Ce guide explique la procédure exacte pour déployer un **nouveau projet** sur cette architecture.

---

## Étape 1 : Préparation du projet (Docker & Ports)

Pour que votre projet tourne de manière isolée sur le serveur, il doit contenir un fichier `docker-compose.yml` à sa racine.

### 1. Trouver un port disponible sur le VPS
Connectez-vous au VPS et lancez cette commande pour voir les ports déjà utilisés par les autres projets de l'agence :
```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
```
> ⚠️ **RÈGLE D'OR :** Choisissez un port externe libre (ex: si `3000` à `3004` sont pris, prenez `3005`).

### 2. Exemple de `docker-compose.yml` complet

```yaml
services:
  # Optionnel : Si le projet utilise sa propre base de données
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secretpassword
      POSTGRES_DB: app_db
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Application Web
  app:
    build: .
    restart: unless-stopped
    ports:
      # Port libre sur le VPS : Port exposé par le conteneur
      - "3005:3000"
    env_file:
      - .env
    deploy:
      resources:
        limits:
          cpus: '1.5'
          memory: 1500M
    # Décommenter si le service dépend de postgres
    # depends_on:
    #   postgres:
    #     condition: service_healthy

volumes:
  db_data: # Persistance des données même après redémarrage
```

---

## Étape 2 : Installation du Runner GitHub pour le projet

*Chaque projet (dépôt) dispose de son propre Runner isolé sur le VPS.*

1. **Sur GitHub :**
   * Allez dans le dépôt du projet > **Settings** > **Actions** > **Runners**.
   * Cliquez sur **New self-hosted runner** et choisissez **Linux (x64)**. Laissez la page ouverte.

2. **Sur le VPS (Création du dossier) :**
   * Connectez-vous en SSH avec l'utilisateur `runner` :
     ```bash
     ssh runner@<IP_DU_VPS>
     ```
   * Créez un dossier pour ce projet et entrez dedans :
     ```bash
     mkdir runner-nomDuProjet && cd runner-nomDuProjet
     ```

3. **Télécharger et Configurer :**
   * Exécutez les commandes `curl` et `tar` affichées sur votre écran GitHub.
   * Lancez la configuration (sans `sudo`) :
     ```bash
     ./config.sh --url https://github.com/Digital-Speak-Group/VotreProjet --token XXXXXXXXXXXX
     ```
   * *(Validez les questions par défaut en appuyant sur Entrée).*

4. **Lancer le service en arrière-plan :**
   ```bash
   sudo ./svc.sh install
   sudo ./svc.sh start
   ```
   ✅ *Le runner apparaît désormais "Online" dans les paramètres GitHub du dépôt.*

---

## Étape 3 : Fichier d'environnement `.env` (Sécurité)

Comme le fichier `.env` est exclu de Git, vous devez le créer **une seule fois** directement dans l'espace de travail du Runner sur le VPS :

1. Repérez le dossier de travail du runner :
   ```bash
   # Depuis /home/runner/runner-nomDuProjet
   cd _work/VotreProjet/VotreProjet
   ```
   *(Si le dossier `_work` n'existe pas encore, lancez un premier déploiement ou créez-le).*

2. Créez et remplissez le `.env` de production :
   ```bash
   nano .env
   ```
3. Sauvegardez (`CTRL+O`, puis `CTRL+X`). Ce fichier restera conservé sur le serveur lors des prochains déploiements.

---

## Étape 4 : Automatisation CI/CD (Workflow GitHub Actions)

Créez le fichier `.github/workflows/deploy.yml` dans votre dépôt GitHub :

```yaml
name: Deploy to VPS (Digital Speak)

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    name: Build & Deploy
    runs-on: self-hosted

    steps:
      - name: 📥 Récupérer le code
        uses: actions/checkout@v4

      - name: 🗄️ Appliquer les migrations de base de données (si applicable)
        run: |
          # Exécute la migration si le script existe dans package.json
          if grep -q "db:migrate" package.json 2>/dev/null; then
            docker compose run --rm app npm run db:migrate || true
          fi

      - name: 🚀 Lancer les conteneurs Docker
        run: |
          docker compose up -d --build
          # Nettoyer les images inutilisées pour préserver le disque du VPS
          docker image prune -f

      - name: 🩺 Vérifier la santé du conteneur
        run: |
          sleep 5
          docker compose ps
```

---

## Étape 5 : Configuration du nom de domaine et SSL (Nginx)

1. **Pointage DNS :**
   Sur votre registrar (Hostinger, Cloudflare, OVH...), ajoutez un enregistrement **A** :
   - Nom : `votre-domaine.com` (ou sous-domaine `app.votre-domaine.com`)
   - Valeur : **Adresse IP publique du VPS**

2. **Créer le fichier Nginx sur le VPS :**
   ```bash
   sudo nano /etc/nginx/sites-available/nomDuProjet
   ```

3. **Ajouter la configuration Reverse Proxy (Optimisée WebSockets + Uploads) :**
   ```nginx
   server {
       listen 80;
       server_name projet.com www.projet.com;

       # Autoriser les uploads jusqu'à 50 Mo (évite l'erreur 413)
       client_max_body_size 50M;

       location / {
           proxy_pass http://127.0.0.1:3005; # Remplacez 3005 par le port de votre projet
           proxy_http_version 1.1;

           # Support des WebSockets et Realtime
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";

           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Activer le site et tester Nginx :**
   ```bash
   sudo ln -s /etc/nginx/sites-available/nomDuProjet /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Générer le certificat SSL HTTPS gratuit :**
   ```bash
   sudo certbot --nginx -d projet.com -d www.projet.com
   ```

🎉 **C'est terminé !** Le projet est maintenant en ligne, sécurisé en HTTPS, supporte les WebSockets et les gros fichiers, et se met à jour automatiquement à chaque `git push`.