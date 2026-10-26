# Guide de Déploiement VPS — GetFunnels V1

Ce guide détaille la mise en production de GetFunnels sur un VPS (Ubuntu 22.04 ou 24.04 LTS) avec Docker Compose et SSL automatique (HTTPS).

---

## 1. Prérequis sur le VPS

- **OS :** Ubuntu 22.04 LTS ou 24.04 LTS.
- **Ressources recommandées :** 2 vCPU, 4 Go de RAM (nécessaire pour la compilation Next.js et l'export PDF Chromium headless), 25 Go d'espace disque.
- **Un nom de domaine :** ex. `app.getfunnels.agency` ou `app.votre-domaine.com`.
- **Enregistrement DNS :** Créer un champ `A` faisant pointer votre sous-domaine/domaine vers l'adresse IP publique de votre VPS.

---

## 2. Étape 1 : Installer Docker et Git sur le VPS

Connectez-vous à votre VPS en SSH :
```bash
ssh root@<IP_DU_VPS>
```

Mettez à jour le système et installez Docker et Git :
```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y git curl ufw

# Installer Docker officiel
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Vérifier Docker et Docker Compose
docker --version
docker compose version
```

Configurez le pare-feu (UFW) :
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 3. Étape 2 : Cloner le dépôt et configurer `.env`

Clonez votre dépôt :
```bash
git clone https://github.com/<votre-organisation>/get-funnel-go-v2.git /opt/getfunnels
cd /opt/getfunnels
```

Créez le fichier de configuration `.env` :
```bash
nano .env
```

Renseignez vos clés de production :
```env
# URL publique de votre application (HTTPS obligatoire en production)
NEXT_PUBLIC_APP_URL=https://app.votre-domaine.com

# Base de données PostgreSQL locale dans Docker
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/getfunnels?schema=public
DATABASE_SSL=false

# Supabase Auth, Storage et Realtime
NEXT_PUBLIC_SUPABASE_URL=https://ayafpnkcsssgvxxeluwi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# IA (Groq / Anthropic)
GROQ_API_KEY=gsk_...
AI_MODEL_FAST=openai/gpt-oss-20b
AI_MODEL_QUALITY=openai/gpt-oss-120b

# Stripe (Paiements de production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Emails transactionnels (Resend)
RESEND_API_KEY=re_...
```

Sauvegardez avec `Ctrl+O` puis quittez avec `Ctrl+X`.

---

## 4. Étape 3 : Lancer la base de données et appliquer les migrations

1. Démarrez le service PostgreSQL :
```bash
docker compose up -d postgres
```

2. Exécutez les migrations de schéma et le seed initial :
```bash
# Lancer les migrations
docker compose run --rm app npm run db:migrate

# Initialiser les thèmes et les templates
docker compose run --rm app npm run db:seed
```

---

## 5. Étape 4 : Lancer l'application complète

Compilez et démarrez tous les conteneurs :
```bash
docker compose up -d --build
```

Vérifiez que les conteneurs tournent correctement :
```bash
docker compose ps
docker compose logs -f app
```
L'application écoute désormais sur le port interne `3000`.

---

## 6. Étape 5 : Configurer HTTPS automatique avec Caddy (Recommandé)

Caddy génère et renouvelle automatiquement vos certificats SSL Let's Encrypt sans aucune configuration complexe.

1. Installez Caddy sur le serveur :
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

2. Éditez `/etc/caddy/Caddyfile` :
```bash
sudo nano /etc/caddy/Caddyfile
```

Remplacez tout le contenu par :
```caddy
app.votre-domaine.com {
    reverse_proxy localhost:3000 {
        header_up X-Forwarded-Proto https
    }
}
```

3. Redémarrez Caddy :
```bash
sudo systemctl reload caddy
```
Votre application est maintenant accessible en **HTTPS** sécurisé sur `https://app.votre-domaine.com` !

---

## 7. Étape 6 : Paramétrer Supabase et Stripe

1. **Supabase Dashboard :**
   - Allez dans **Authentication** > **URL Configuration**.
   - **Site URL :** `https://app.votre-domaine.com`
   - **Redirect URLs :** Ajoutez `https://app.votre-domaine.com/**`

2. **Stripe Dashboard :**
   - Allez dans **Développeurs** > **Webhooks**.
   - Ajoutez un endpoint : `https://app.votre-domaine.com/api/stripe/webhook`
   - Sélectionnez les événements :
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Récupérez le secret de signature (`whsec_...`) et ajoutez-le dans votre fichier `.env`.

---

## 8. Commandes utiles de maintenance

- **Voir les logs en direct :**
  ```bash
  docker compose logs -f app
  ```

- **Mettre à jour l'application après un `git pull` :**
  ```bash
  git pull origin main
  docker compose run --rm app npm run db:migrate
  docker compose up -d --build app
  ```

- **Sauvegarder la base de données :**
  ```bash
  docker compose exec -t postgres pg_dump -U postgres getfunnels > backup-$(date +%F).sql
  ```

- **Restaurer une sauvegarde :**
  ```bash
  cat backup.sql | docker compose exec -T postgres psql -U postgres -d getfunnels
  ```
