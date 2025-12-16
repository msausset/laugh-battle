#!/bin/bash

# Laugh Battle - Script de Setup Automatique
# Ce script installe et configure le projet automatiquement

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║              😂  Laugh Battle Setup  😂                 ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Vérification des prérequis
echo "🔍 Vérification des prérequis..."

# Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer : https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 ou supérieure requise. Vous avez : $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé."
    exit 1
fi
echo "✅ npm $(npm -v)"

# PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL CLI non trouvé. Assurez-vous qu'un serveur PostgreSQL est accessible."
else
    echo "✅ PostgreSQL $(psql --version | head -n 1)"
fi

echo ""
echo "📦 Installation des dépendances..."
npm install

echo ""
echo "📝 Configuration de l'environnement..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Fichier .env créé"
    echo "⚠️  N'oubliez pas de modifier .env avec vos configurations !"
else
    echo "ℹ️  Le fichier .env existe déjà"
fi

echo ""
echo "🗄️  Configuration de la base de données..."
read -p "Voulez-vous créer la base de données 'laugh_battle' maintenant ? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v createdb &> /dev/null; then
        createdb laugh_battle 2>/dev/null && echo "✅ Base de données 'laugh_battle' créée" || echo "ℹ️  La base de données existe déjà ou erreur de création"
    else
        echo "⚠️  Créez manuellement la base de données avec : createdb laugh_battle"
    fi
fi

echo ""
echo "🔨 Génération du client Prisma..."
npm run prisma:generate

echo ""
echo "🚀 Application des migrations..."
npm run prisma:migrate

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║                ✨  Setup Terminé !  ✨                   ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📚 Prochaines étapes :"
echo ""
echo "  1. Vérifiez votre fichier .env"
echo "  2. Lancez l'application : npm run dev"
echo "  3. Ouvrez http://localhost:3000 dans votre navigateur"
echo ""
echo "🎮 Pour tester :"
echo "  - Ouvrez 2 fenêtres/onglets sur http://localhost:3000"
echo "  - Cliquez sur 'Commencer à jouer' dans les deux"
echo "  - Ils seront matchés automatiquement !"
echo ""
echo "📖 Documentation complète : README.md"
echo "⚡ Guide rapide : QUICKSTART.md"
echo ""
echo "Bon développement ! 🚀"
