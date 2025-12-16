# 🏗️ Architecture du Projet

Ce document décrit l'architecture technique de Laugh Battle.

## 📋 Vue d'Ensemble

```
┌─────────────────┐         WebSocket         ┌─────────────────┐
│                 │ ◄─────────────────────────► │                 │
│   Frontend      │                             │   Backend       │
│   (Next.js)     │         HTTP/REST           │   (NestJS)      │
│                 │ ◄─────────────────────────► │                 │
└─────────────────┘                             └────────┬────────┘
        │                                                │
        │ WebRTC (P2P)                                  │
        │ Video + Audio                                  │
        ▼                                                ▼
┌─────────────────┐                             ┌─────────────────┐
│   Peer 1        │ ◄───────────────────────────┤   PostgreSQL    │
│   (Browser)     │      WebRTC Direct          │   (Database)    │
│                 │                             └─────────────────┘
└─────────────────┘
```

## 🧩 Structure des Modules

### Backend (NestJS)

#### 1. **App Module** (`app.module.ts`)
- Point d'entrée principal
- Importe tous les modules
- Configure ConfigModule global

#### 2. **Prisma Module** (`prisma/`)
- Service de connexion à la base de données
- Client Prisma singleton
- Gestion du cycle de vie de la connexion

#### 3. **Matchmaking Module** (`matchmaking/`)
- **Service** : Gère la file d'attente des joueurs
  - Ajout/retrait de joueurs
  - Algorithme de matching (FIFO)
  - Création de parties
- **Gateway** : WebSocket pour le matchmaking
  - Événements : JOIN_QUEUE, LEAVE_QUEUE
  - Broadcasting : MATCH_FOUND

#### 4. **WebRTC Module** (`webrtc/`)
- **Gateway** : Serveur de signaling WebRTC
  - Relais des offres (OFFER)
  - Relais des réponses (ANSWER)
  - Relais des ICE candidates
  - Gestion des rooms de jeu

#### 5. **Game Module** (`game/`)
- **Service** : Logique de jeu
  - États des parties en mémoire
  - Gestion des victoires/défaites
  - Persistence en DB
- **Gateway** : Événements de jeu
  - PLAYER_LAUGHED
  - GAME_END
  - REMATCH

### Frontend (Next.js)

#### 1. **App Router** (`app/`)
- `layout.tsx` : Layout global
- `page.tsx` : Page d'accueil
- `game/page.tsx` : Page de jeu principale

#### 2. **Hooks** (`hooks/`)
- `useSocket` : Connexion Socket.IO
  - Initialisation
  - Reconnexion automatique
  - Gestion des états
- `useWebRTC` : Connexion WebRTC
  - Capture média local
  - Peer connection (simple-peer)
  - Signaling via Socket.IO
  - Stream remote

#### 3. **Components** (`components/`)
- `VideoPlayer` : Affichage vidéo
- `GameControls` : Contrôles de jeu
- `MatchmakingScreen` : Écran de recherche
- `GameEndScreen` : Écran de fin de partie

#### 4. **Types** (`types/`)
- Événements Socket.IO
- Interfaces de données
- États de jeu

## 🔄 Flux de Données

### 1. Matchmaking

```
1. User → Frontend : Click "Commencer à jouer"
2. Frontend → Backend : emit(JOIN_QUEUE)
3. Backend : Ajoute à la file d'attente
4. Backend : Vérifie toutes les 1s si 2+ joueurs
5. Backend → Frontend (x2) : emit(MATCH_FOUND, {gameId, opponentId, isInitiator})
6. Backend → Database : CREATE Game
```

### 2. Connexion WebRTC

```
1. Frontend (Initiator) : new SimplePeer({initiator: true})
2. Peer → Frontend : signal(offer)
3. Frontend → Backend : emit(OFFER, {offer, gameId})
4. Backend → Frontend (Peer 2) : emit(OFFER, {offer})
5. Peer 2 : peer.signal(offer)
6. Peer 2 → Frontend : signal(answer)
7. Frontend → Backend : emit(ANSWER, {answer, gameId})
8. Backend → Frontend (Peer 1) : emit(ANSWER, {answer})
9. Peer 1 : peer.signal(answer)
10. ICE Candidates : Échangés de la même manière
11. WebRTC Connection : Établie en peer-to-peer
```

### 3. Partie de Jeu

```
1. Backend → Frontend (x2) : emit(GAME_START)
2. Joueurs : Interagissent via vidéo
3. Joueur 1 → Frontend : Click "J'ai ri !"
4. Frontend → Backend : emit(PLAYER_LAUGHED, {gameId})
5. Backend : Détermine le gagnant (Joueur 2)
6. Backend → Database : UPDATE Game (winnerId, status: FINISHED)
7. Backend → Frontend (Joueur 1) : emit(GAME_END, {result: 'lose'})
8. Backend → Frontend (Joueur 2) : emit(GAME_END, {result: 'win'})
```

## 🗄️ Modèle de Données

### User
```typescript
{
  id: string (UUID)
  socketId: string (unique)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Game
```typescript
{
  id: string (UUID)
  player1Id: string
  player2Id: string
  status: GameStatus (WAITING | PLAYING | FINISHED | CANCELLED)
  winnerId?: string
  startedAt: DateTime
  endedAt?: DateTime
}
```

## 🔐 Sécurité

### Implemented
- ✅ CORS configuré par domaine
- ✅ Variables d'environnement pour secrets
- ✅ Validation des événements Socket.IO
- ✅ Cleanup automatique des connexions
- ✅ Isolation des rooms WebRTC par gameId

### À Implémenter (Production)
- [ ] Rate limiting (trop de JOIN_QUEUE)
- [ ] Authentification JWT pour Socket.IO
- [ ] Validation Zod/Joi des payloads
- [ ] Timeouts pour les parties inactives
- [ ] Blacklist IP pour abus
- [ ] Content Security Policy (CSP)

## 🚀 Performance

### Optimisations Actuelles
- ✅ Monorepo (code sharing)
- ✅ WebRTC P2P (pas de relay vidéo)
- ✅ Prisma avec connection pooling
- ✅ React Server Components (Next.js 14)
- ✅ Tailwind CSS (purge CSS)

### Optimisations Futures
- [ ] Redis pour la queue de matchmaking
- [ ] Cluster mode pour NestJS
- [ ] CDN pour assets statiques
- [ ] Code splitting frontend
- [ ] Server-side rendering
- [ ] TURN server auto-scaling

## 📡 WebSocket Events

### Client → Server
```typescript
JOIN_QUEUE        // Rejoindre la file d'attente
LEAVE_QUEUE       // Quitter la file
OFFER             // Envoi d'une offre WebRTC
ANSWER            // Envoi d'une réponse WebRTC
ICE_CANDIDATE     // Envoi d'un ICE candidate
PLAYER_LAUGHED    // Déclaration de rire (défaite)
```

### Server → Client
```typescript
QUEUE_STATUS      // État de la file d'attente
MATCH_FOUND       // Match trouvé
GAME_START        // Début de la partie
OFFER             // Réception offre WebRTC
ANSWER            // Réception réponse WebRTC
ICE_CANDIDATE     // Réception ICE candidate
GAME_END          // Fin de la partie
OPPONENT_LEFT     // Adversaire déconnecté
ERROR             // Erreur
```

## 🧪 Testing Strategy

### Unit Tests
- Services backend (matchmaking logic)
- Hooks frontend (useWebRTC)
- Composants React

### Integration Tests
- Socket.IO événements
- Prisma queries
- WebRTC signaling flow

### E2E Tests
- Matchmaking complet
- Partie complète
- Déconnexion/reconnexion

## 📈 Scalabilité

### Scaling Backend

**Horizontal Scaling** :
```
Load Balancer (nginx)
    ↓
[Backend 1] [Backend 2] [Backend 3]
    ↓           ↓           ↓
Redis (shared queue + sessions)
    ↓
PostgreSQL (primary)
```

**Sticky Sessions** :
- Socket.IO nécessite sticky sessions
- Utiliser Redis adapter pour Socket.IO

### Scaling Database

**Read Replicas** :
- Lecture : réplicas
- Écriture : master

**Partitioning** :
- Shard par région géographique
- Archive des anciennes parties

## 🔍 Monitoring

### Métriques à Suivre
- Connexions Socket.IO actives
- Taille de la queue de matchmaking
- Temps moyen de matchmaking
- Taux de succès WebRTC
- Durée moyenne des parties
- Erreurs de connexion

### Outils Recommandés
- **Logs** : Winston, Pino
- **APM** : New Relic, Datadog
- **Errors** : Sentry
- **Analytics** : Mixpanel, Amplitude

## 📚 Ressources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Prisma Documentation](https://www.prisma.io/docs/)
