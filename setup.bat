@echo off
REM Laugh Battle - Script de Setup Automatique (Windows)
REM Ce script installe et configure le projet automatiquement

echo ================================================================
echo.
echo               😂  Laugh Battle Setup  😂
echo.
echo ================================================================
echo.

REM Vérification de Node.js
echo 🔍 Verification des prerequis...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js n'est pas installe. Veuillez l'installer : https://nodejs.org/
    pause
    exit /b 1
)

node -v
echo ✅ Node.js OK

REM Vérification de npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm n'est pas installe.
    pause
    exit /b 1
)

npm -v
echo ✅ npm OK

echo.
echo 📦 Installation des dependances...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de l'installation des dependances
    pause
    exit /b 1
)

echo.
echo 📝 Configuration de l'environnement...
if not exist .env (
    copy .env.example .env
    echo ✅ Fichier .env cree
    echo ⚠️  N'oubliez pas de modifier .env avec vos configurations !
) else (
    echo ℹ️  Le fichier .env existe deja
)

echo.
echo 🗄️  Configuration de la base de donnees...
echo ⚠️  Assurez-vous que PostgreSQL est installe et demarre
echo     Creez manuellement la base de donnees avec : createdb laugh_battle
echo     Ou utilisez pgAdmin / DBeaver
pause

echo.
echo 🔨 Generation du client Prisma...
call npm run prisma:generate
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de la generation Prisma
    pause
    exit /b 1
)

echo.
echo 🚀 Application des migrations...
call npm run prisma:migrate
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors des migrations
    echo Verifiez que PostgreSQL est demarre et que DATABASE_URL est correct dans .env
    pause
    exit /b 1
)

echo.
echo ================================================================
echo.
echo                 ✨  Setup Termine !  ✨
echo.
echo ================================================================
echo.
echo 📚 Prochaines etapes :
echo.
echo   1. Verifiez votre fichier .env
echo   2. Lancez l'application : npm run dev
echo   3. Ouvrez http://localhost:3000 dans votre navigateur
echo.
echo 🎮 Pour tester :
echo   - Ouvrez 2 fenetres/onglets sur http://localhost:3000
echo   - Cliquez sur 'Commencer a jouer' dans les deux
echo   - Ils seront matches automatiquement !
echo.
echo 📖 Documentation complete : README.md
echo ⚡ Guide rapide : QUICKSTART.md
echo.
echo Bon developpement ! 🚀
echo.
pause
