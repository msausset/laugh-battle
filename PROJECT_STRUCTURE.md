# 📁 Structure du Projet

```
laugh-battle/
│
├── 📄 Configuration Root
│   ├── package.json              # Configuration monorepo + scripts
│   ├── .env.example              # Variables d'environnement exemple
│   ├── .gitignore                # Fichiers à ignorer par Git
│   ├── .prettierrc               # Configuration Prettier
│   ├── .eslintrc.json            # Configuration ESLint
│   ├── .dockerignore             # Fichiers à ignorer par Docker
│   ├── docker-compose.yml        # Configuration Docker Compose
│   └── ecosystem.config.js       # Configuration PM2 (production)
│
├── 📚 Documentation
│   ├── README.md                 # Documentation principale
│   ├── QUICKSTART.md             # Guide de démarrage rapide
│   ├── ARCHITECTURE.md           # Architecture technique
│   ├── CONTRIBUTING.md           # Guide de contribution
│   ├── PROJECT_STRUCTURE.md      # Ce fichier
│   └── LICENSE                   # Licence MIT
│
├── 🔧 Scripts
│   ├── setup.sh                  # Setup automatique (Linux/macOS)
│   └── setup.bat                 # Setup automatique (Windows)
│
├── 🎯 Backend (apps/backend/)
│   ├── package.json              # Dépendances backend
│   ├── tsconfig.json             # Configuration TypeScript
│   ├── nest-cli.json             # Configuration NestJS CLI
│   ├── Dockerfile                # Image Docker backend
│   │
│   ├── prisma/
│   │   └── schema.prisma         # Schéma de base de données
│   │
│   └── src/
│       ├── main.ts               # Point d'entrée
│       ├── app.module.ts         # Module principal
│       │
│       ├── types/
│       │   └── index.ts          # Types partagés
│       │
│       ├── prisma/
│       │   ├── prisma.module.ts  # Module Prisma
│       │   └── prisma.service.ts # Service Prisma
│       │
│       ├── matchmaking/
│       │   ├── matchmaking.module.ts   # Module matchmaking
│       │   ├── matchmaking.service.ts  # Logique matchmaking
│       │   └── matchmaking.gateway.ts  # WebSocket gateway
│       │
│       ├── webrtc/
│       │   ├── webrtc.module.ts        # Module WebRTC
│       │   └── webrtc.gateway.ts       # Signaling WebRTC
│       │
│       └── game/
│           ├── game.module.ts          # Module de jeu
│           ├── game.service.ts         # Logique de jeu
│           └── game.gateway.ts         # Événements de jeu
│
└── 🌐 Frontend (apps/frontend/)
    ├── package.json              # Dépendances frontend
    ├── tsconfig.json             # Configuration TypeScript
    ├── next.config.js            # Configuration Next.js
    ├── tailwind.config.ts        # Configuration Tailwind CSS
    ├── postcss.config.js         # Configuration PostCSS
    ├── Dockerfile                # Image Docker frontend
    │
    └── src/
        ├── app/                  # App Router Next.js
        │   ├── layout.tsx        # Layout global
        │   ├── page.tsx          # Page d'accueil
        │   ├── globals.css       # Styles globaux
        │   └── game/
        │       └── page.tsx      # Page de jeu
        │
        ├── components/           # Composants React
        │   ├── VideoPlayer.tsx   # Lecteur vidéo
        │   ├── GameControls.tsx  # Contrôles de jeu
        │   ├── MatchmakingScreen.tsx  # Écran matchmaking
        │   └── GameEndScreen.tsx      # Écran de fin
        │
        ├── hooks/                # Hooks personnalisés
        │   ├── useSocket.ts      # Hook Socket.IO
        │   └── useWebRTC.ts      # Hook WebRTC
        │
        └── types/                # Types TypeScript
            └── index.ts          # Types partagés
```

## 📊 Statistiques

- **Total fichiers** : ~48 fichiers
- **Langages** : TypeScript, CSS, Shell
- **Frameworks** : NestJS, Next.js, React
- **Base de données** : PostgreSQL + Prisma
- **Temps réel** : Socket.IO + WebRTC

## 🔑 Fichiers Clés

### Backend
- `apps/backend/src/main.ts` - Point d'entrée du serveur
- `apps/backend/src/matchmaking/matchmaking.service.ts` - Algorithme de matchmaking
- `apps/backend/src/webrtc/webrtc.gateway.ts` - Signaling WebRTC
- `apps/backend/src/game/game.service.ts` - Logique de jeu
- `apps/backend/prisma/schema.prisma` - Schéma de données

### Frontend
- `apps/frontend/src/app/page.tsx` - Page d'accueil
- `apps/frontend/src/app/game/page.tsx` - Page de jeu principale
- `apps/frontend/src/hooks/useWebRTC.ts` - Gestion WebRTC côté client
- `apps/frontend/src/components/VideoPlayer.tsx` - Affichage vidéo

## 🎨 Technologies par Fichier

```typescript
// Backend
main.ts              → NestJS + Express
*.gateway.ts         → Socket.IO
*.service.ts         → Business Logic
schema.prisma        → Prisma ORM

// Frontend
page.tsx             → React Server Components
*.tsx (components)   → React Client Components
useWebRTC.ts         → simple-peer
globals.css          → Tailwind CSS
```

## 📦 Dépendances Principales

### Backend
- @nestjs/core, @nestjs/common
- @nestjs/platform-socket.io
- @prisma/client
- socket.io

### Frontend
- next (14.x)
- react (18.x)
- socket.io-client
- simple-peer
- tailwindcss

## 🚀 Points d'Entrée

- **Backend** : `apps/backend/src/main.ts:bootstrap()`
- **Frontend** : `apps/frontend/src/app/layout.tsx`
- **Database** : `apps/backend/prisma/schema.prisma`

## 📝 Fichiers de Configuration

| Fichier | Purpose |
|---------|---------|
| `package.json` (root) | Workspaces monorepo |
| `tsconfig.json` | Configuration TypeScript |
| `.env` | Variables d'environnement |
| `docker-compose.yml` | Orchestration Docker |
| `ecosystem.config.js` | Production PM2 |
| `tailwind.config.ts` | Style Tailwind |
| `nest-cli.json` | CLI NestJS |

## 🔍 Conventions de Nommage

- **Modules** : `*.module.ts`
- **Services** : `*.service.ts`
- **Gateways** : `*.gateway.ts`
- **Components** : `PascalCase.tsx`
- **Hooks** : `useHookName.ts`
- **Types** : `index.ts` dans dossier `types/`

## 🌳 Arbre de Dépendances

```
App Module
├── ConfigModule (global)
├── PrismaModule (global)
├── MatchmakingModule
│   └── MatchmakingGateway
│   └── MatchmakingService
├── WebrtcModule
│   └── WebrtcGateway
└── GameModule
    └── GameGateway
    └── GameService
```
