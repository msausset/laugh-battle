# 🤝 Guide de Contribution

Merci de contribuer à Laugh Battle ! Ce document explique comment contribuer au projet.

## 📋 Code de Conduite

- Soyez respectueux et inclusif
- Acceptez les critiques constructives
- Concentrez-vous sur ce qui est meilleur pour la communauté

## 🚀 Comment Contribuer

### 1. Fork et Clone

```bash
# Fork le projet sur GitHub
# Puis clone votre fork
git clone https://github.com/votre-username/laugh-battle.git
cd laugh-battle
```

### 2. Installation

```bash
# Exécutez le script de setup
bash setup.sh  # Linux/macOS
setup.bat      # Windows

# Ou manuellement
npm install
npm run prisma:generate
npm run prisma:migrate
```

### 3. Créer une Branche

```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
# ou
git checkout -b fix/correction-du-bug
```

### 4. Développer

```bash
# Lancer en mode développement
npm run dev

# Backend uniquement
npm run dev:backend

# Frontend uniquement
npm run dev:frontend
```

### 5. Tester

```bash
# Tests unitaires (à implémenter)
npm run test

# Tests E2E (à implémenter)
npm run test:e2e

# Vérifier le linting
npm run lint
```

### 6. Commit

Utilisez des messages de commit clairs et descriptifs :

```bash
git add .
git commit -m "feat: ajoute le système de chat textuel"
git commit -m "fix: corrige la déconnexion WebRTC"
git commit -m "docs: améliore le README"
```

**Convention de commits** :
- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `docs:` documentation
- `style:` formatage, point-virgules manquants, etc.
- `refactor:` refactoring de code
- `test:` ajout de tests
- `chore:` maintenance

### 7. Push et Pull Request

```bash
git push origin feature/ma-nouvelle-fonctionnalite
```

Puis créez une Pull Request sur GitHub.

## 🎯 Domaines de Contribution

### Frontend
- [ ] Amélioration de l'UI/UX
- [ ] Responsive design mobile
- [ ] Filtres vidéo amusants
- [ ] Animations et transitions
- [ ] Dark mode
- [ ] Internationalisation (i18n)

### Backend
- [ ] Optimisation des performances
- [ ] Rate limiting
- [ ] Système de classement
- [ ] Statistiques utilisateur
- [ ] API REST pour mobile
- [ ] Tests automatisés

### Features
- [ ] Chat textuel
- [ ] Timer de partie
- [ ] Détection automatique du rire (ML)
- [ ] Replay des parties
- [ ] Système d'amis
- [ ] Salles privées
- [ ] Modes de jeu alternatifs

### Infrastructure
- [ ] Configuration Docker améliorée
- [ ] CI/CD avec GitHub Actions
- [ ] Monitoring et logging
- [ ] Serveur TURN auto-hébergé
- [ ] Load balancing

### Documentation
- [ ] Tutoriels vidéo
- [ ] API documentation (Swagger)
- [ ] Architecture diagrams
- [ ] Exemples de déploiement

## 📝 Standards de Code

### TypeScript
- Utilisez TypeScript strict
- Typez toutes les fonctions et variables
- Évitez `any` autant que possible

### React
- Utilisez des composants fonctionnels
- Préférez les hooks aux class components
- Extractez la logique complexe dans des hooks personnalisés

### NestJS
- Suivez l'architecture modulaire
- Utilisez l'injection de dépendances
- Documentez les endpoints avec Swagger

### Style
- Utilisez Prettier pour le formatage
- Suivez les règles ESLint
- Nommage clair et explicite

```bash
# Formater le code
npm run format

# Vérifier le linting
npm run lint
```

## 🐛 Rapporter un Bug

Créez une issue sur GitHub avec :

1. **Titre clair** : "Bug: La vidéo ne se charge pas sur Safari"
2. **Description** : Que s'est-il passé ?
3. **Étapes pour reproduire** :
   - Étape 1
   - Étape 2
   - Étape 3
4. **Résultat attendu** : Ce qui devrait se passer
5. **Résultat actuel** : Ce qui se passe réellement
6. **Environnement** :
   - OS : Windows 11
   - Navigateur : Safari 17
   - Node.js : v18.0.0
7. **Captures d'écran** : Si applicable
8. **Logs** : Console navigateur / logs backend

## 💡 Proposer une Fonctionnalité

Créez une issue avec :

1. **Titre** : "Feature: Ajouter un système de chat"
2. **Problème** : Quel problème résout cette fonctionnalité ?
3. **Solution proposée** : Comment l'implémenter ?
4. **Alternatives** : Autres solutions envisagées
5. **Impact** : Utilisateurs affectés, complexité

## 🔍 Review Process

1. Un mainteneur review votre PR
2. Des changements peuvent être demandés
3. Une fois approuvée, la PR est mergée
4. Votre contribution est dans le projet ! 🎉

## 📚 Ressources Utiles

- [Architecture du Projet](./ARCHITECTURE.md)
- [Guide de Démarrage Rapide](./QUICKSTART.md)
- [Documentation NestJS](https://docs.nestjs.com/)
- [Documentation Next.js](https://nextjs.org/docs)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

## ❓ Questions ?

- Ouvrez une issue avec le label `question`
- Rejoignez les discussions GitHub
- Contactez les mainteneurs

## 🙏 Remerciements

Merci à tous les contributeurs qui rendent ce projet meilleur !

---

**Note** : En contribuant, vous acceptez que votre code soit sous licence MIT.
