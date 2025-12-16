# 🚀 Guide de Démarrage Rapide

Ce guide vous permet de lancer le projet en moins de 5 minutes.

## ⚡ Installation Express

```bash
# 1. Installer les dépendances
npm install

# 2. Copier les variables d'environnement
cp .env.example .env

# 3. Configurer PostgreSQL
# Option A : Utiliser PostgreSQL local
createdb laugh_battle

# Option B : Utiliser Docker
docker run -d \
  --name laugh-battle-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=laugh_battle \
  -p 5432:5432 \
  postgres:15-alpine

# 4. Modifier .env si nécessaire
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/laugh_battle?schema=public"

# 5. Initialiser Prisma
npm run prisma:generate
npm run prisma:migrate

# 6. Lancer l'application
npm run dev
```

## 🌐 Accès

- **Frontend** : http://localhost:3000
- **Backend** : http://localhost:3001
- **Prisma Studio** : `npm run prisma:studio` puis http://localhost:5555

## ✅ Checklist de Vérification

- [ ] Node.js >= 18 installé (`node -v`)
- [ ] PostgreSQL >= 14 installé et démarré
- [ ] Base de données `laugh_battle` créée
- [ ] Fichier `.env` configuré
- [ ] Migrations Prisma appliquées
- [ ] Backend démarré sur le port 3001
- [ ] Frontend démarré sur le port 3000
- [ ] Navigateur autorise caméra/micro

## 🐛 Problèmes Courants

### Le backend ne démarre pas

```bash
# Vérifier que PostgreSQL est démarré
sudo service postgresql status  # Linux
brew services list             # macOS

# Vérifier que la base de données existe
psql -U postgres -l | grep laugh_battle
```

### Erreur de migration Prisma

```bash
# Réinitialiser les migrations
cd apps/backend
npx prisma migrate reset
npx prisma migrate dev
```

### La vidéo ne fonctionne pas

- Utilisez HTTPS en production (WebRTC nécessite HTTPS)
- Autorisez l'accès caméra/micro dans votre navigateur
- Vérifiez les logs de la console navigateur

### Port déjà utilisé

```bash
# Trouver et tuer le processus
# Linux/macOS
lsof -ti:3000 | xargs kill
lsof -ti:3001 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## 🎮 Tester l'Application

Pour tester le matchmaking, vous devez ouvrir deux onglets/fenêtres :

1. Ouvrir http://localhost:3000 dans Chrome
2. Ouvrir http://localhost:3000 dans un onglet privé ou Firefox
3. Cliquer sur "Commencer à jouer" dans les deux fenêtres
4. Ils seront matchés automatiquement !

## 📚 Documentation Complète

Consultez le [README.md](./README.md) pour la documentation complète.

## 💡 Tips

- Utilisez `npm run prisma:studio` pour explorer la base de données visuellement
- Les logs du backend montrent les événements Socket.IO en temps réel
- La console du navigateur affiche les logs WebRTC

## 🆘 Besoin d'Aide ?

1. Consultez les logs du backend : `npm run dev:backend`
2. Consultez la console du navigateur (F12)
3. Vérifiez le fichier README.md
4. Ouvrez une issue sur GitHub
