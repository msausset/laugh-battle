# 😂 Laugh Battle - MVP

Application web temps réel inspirée d'Omegle, transformée en jeu "Essaie de ne pas rire" entre inconnus.

## 🎯 Fonctionnalités

- **Matchmaking instantané** : Connexion automatique avec un joueur aléatoire
- **Vidéo + Audio temps réel** : Communication WebRTC peer-to-peer
- **Jeu simple** : Le premier qui rit perd
- **Interface moderne** : UI/UX soignée avec Tailwind CSS
- **Scalable** : Architecture prête pour la production

## 🧱 Stack Technique

### Frontend
- **Next.js 14** (App Router)
- **React 18** + TypeScript
- **Tailwind CSS** pour le style
- **socket.io-client** pour la communication temps réel
- **simple-peer** pour WebRTC

### Backend
- **NestJS** avec TypeScript
- **Socket.IO** pour les WebSockets
- **Prisma ORM** avec PostgreSQL
- **WebRTC signaling server**

### Infrastructure
- **PostgreSQL** pour la base de données
- **TURN/STUN servers** pour WebRTC (Google STUN par défaut)

## 📦 Structure du Projet

```
laugh-battle/
├── apps/
│   ├── backend/          # Backend NestJS
│   │   ├── prisma/       # Schéma et migrations Prisma
│   │   └── src/
│   │       ├── game/     # Logique de jeu
│   │       ├── matchmaking/  # Système de matchmaking
│   │       ├── webrtc/   # Signaling WebRTC
│   │       └── prisma/   # Service Prisma
│   └── frontend/         # Frontend Next.js
│       └── src/
│           ├── app/      # Pages App Router
│           ├── components/   # Composants React
│           └── hooks/    # Hooks personnalisés
├── packages/
│   └── shared/           # Types partagés (optionnel)
└── package.json          # Configuration monorepo
```

## 🚀 Installation

### Prérequis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 14

### 1. Cloner et installer

```bash
# Cloner le projet
cd laugh-battle

# Installer les dépendances
npm install
```

### 2. Configuration de la base de données

```bash
# Créer une base de données PostgreSQL
createdb laugh_battle

# Ou avec psql
psql -U postgres
CREATE DATABASE laugh_battle;
\q
```

### 3. Variables d'environnement

Copier le fichier `.env.example` et le renommer en `.env` :

```bash
cp .env.example .env
```

Éditer `.env` avec vos valeurs :

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/laugh_battle?schema=public"

# Backend
BACKEND_PORT=3001
BACKEND_URL=http://localhost:3001
NODE_ENV=development

# Frontend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# WebRTC (STUN/TURN)
STUN_SERVER_URL=stun:stun.l.google.com:19302

# JWT Secret (générer une clé sécurisée)
JWT_SECRET=votre-super-secret-jwt-key-change-en-production

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 4. Initialiser Prisma

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les tables en base de données
npm run prisma:migrate
```

### 5. Lancer l'application

```bash
# Mode développement (lance frontend + backend)
npm run dev

# Ou lancer séparément
npm run dev:backend
npm run dev:frontend
```

L'application sera accessible à :
- **Frontend** : http://localhost:3000
- **Backend** : http://localhost:3001

## 🎮 Utilisation

1. Ouvrir http://localhost:3000 dans votre navigateur
2. Autoriser l'accès à la webcam et au microphone
3. Cliquer sur "Commencer à jouer"
4. Attendre qu'un adversaire soit trouvé
5. Le jeu commence ! Essayez de faire rire votre adversaire sans rire vous-même
6. Cliquer sur "J'ai ri !" si vous riez (vous perdez)

## 🔧 Commandes Disponibles

```bash
# Développement
npm run dev                # Lance frontend + backend
npm run dev:backend        # Lance uniquement le backend
npm run dev:frontend       # Lance uniquement le frontend

# Build
npm run build              # Build frontend + backend
npm run build:backend      # Build uniquement le backend
npm run build:frontend     # Build uniquement le frontend

# Production
npm run start:backend      # Lance le backend en production
npm run start:frontend     # Lance le frontend en production

# Prisma
npm run prisma:generate    # Génère le client Prisma
npm run prisma:migrate     # Crée/applique les migrations
npm run prisma:studio      # Ouvre Prisma Studio (GUI)
```

## 🌐 Déploiement en Production

### Option 1 : Vercel (Frontend) + Railway/Render (Backend)

#### Frontend sur Vercel

```bash
# Depuis le dossier apps/frontend
cd apps/frontend
vercel deploy --prod
```

Variables d'environnement Vercel :
- `NEXT_PUBLIC_BACKEND_URL` : URL de votre backend en production

#### Backend sur Railway

1. Créer un nouveau projet sur [Railway](https://railway.app)
2. Connecter votre repo GitHub
3. Ajouter PostgreSQL depuis Railway
4. Configurer les variables d'environnement
5. Déployer

Variables d'environnement Railway :
- `DATABASE_URL` (auto-configuré par Railway)
- `BACKEND_PORT`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `NODE_ENV=production`

### Option 2 : Docker (Full Stack)

```bash
# Créer les images Docker
docker-compose up -d
```

### Option 3 : VPS (Ubuntu/Debian)

```bash
# Sur votre serveur
git clone <repo-url>
cd laugh-battle

# Installer Node.js et PostgreSQL
sudo apt update
sudo apt install nodejs npm postgresql

# Configurer PostgreSQL
sudo -u postgres createdb laugh_battle

# Installation et build
npm install
npm run prisma:generate
npm run prisma:migrate
npm run build

# Utiliser PM2 pour la production
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔒 Sécurité

### Bonnes Pratiques Implémentées

- ✅ CORS configuré
- ✅ Variables d'environnement pour les secrets
- ✅ Validation des événements Socket.IO
- ✅ Nettoyage automatique des connexions
- ✅ Pas de données sensibles exposées

### À Ajouter pour la Production

- [ ] Rate limiting (express-rate-limit)
- [ ] Authentification utilisateur (optionnel)
- [ ] HTTPS/SSL
- [ ] Monitoring (Sentry, LogRocket)
- [ ] Analytics
- [ ] Modération de contenu

## 📊 Base de Données

### Schéma Prisma

```prisma
model User {
  id        String   @id @default(uuid())
  socketId  String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  gamesAsPlayer1 Game[] @relation("Player1")
  gamesAsPlayer2 Game[] @relation("Player2")
}

model Game {
  id        String     @id @default(uuid())
  player1Id String
  player2Id String
  status    GameStatus @default(WAITING)
  winnerId  String?
  startedAt DateTime   @default(now())
  endedAt   DateTime?

  player1   User       @relation("Player1", fields: [player1Id], references: [id])
  player2   User       @relation("Player2", fields: [player2Id], references: [id])
}

enum GameStatus {
  WAITING
  PLAYING
  FINISHED
  CANCELLED
}
```

## 🔍 Debugging

### Backend

```bash
# Logs en temps réel
npm run dev:backend

# Inspecter la base de données
npm run prisma:studio
```

### Frontend

```bash
# Console du navigateur
# Vérifie les logs WebRTC et Socket.IO
```

### WebRTC

Si la connexion vidéo ne fonctionne pas :

1. Vérifier que HTTPS est utilisé (en prod)
2. Vérifier les permissions caméra/micro
3. Tester avec un serveur TURN si derrière un NAT strict
4. Consulter chrome://webrtc-internals/

## 🧪 Tests

```bash
# À implémenter
npm run test
npm run test:e2e
```

## 📝 TODO / Améliorations

- [ ] Système de chat textuel
- [ ] Timer pour limiter la durée des parties
- [ ] Statistiques de joueur
- [ ] Système de points/classement
- [ ] Filtres vidéo amusants
- [ ] Mobile responsive (mode portrait)
- [ ] Détection automatique du rire (ML)
- [ ] Replay des parties
- [ ] Partage sur réseaux sociaux

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

MIT License - Libre d'utilisation

## 👥 Auteur

Développé avec ❤️ pour un MVP fonctionnel et scalable.

---

**Note** : Ce projet est un MVP éducatif. Pour une utilisation en production à grande échelle, des améliorations de sécurité, performance et modération sont nécessaires.
