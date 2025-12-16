'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartGame = () => {
    setIsLoading(true);
    router.push('/game');
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            😂 Laugh Battle
          </h1>
          <p className="text-xl text-gray-300">
            Affronte des inconnus en vidéo et essaie de ne pas rire !
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4">Comment ça marche ?</h2>
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <h3 className="font-semibold text-primary-400">Matchmaking instantané</h3>
                <p className="text-gray-400">Connecte-toi avec un inconnu aléatoirement</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <h3 className="font-semibold text-primary-400">Face à face en vidéo</h3>
                <p className="text-gray-400">Vois ton adversaire en temps réel</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <h3 className="font-semibold text-primary-400">Essaie de ne pas rire</h3>
                <p className="text-gray-400">
                  Fais rire ton adversaire sans rire toi-même. Le premier qui rit perd !
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartGame}
          disabled={isLoading}
          className="group relative px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-xl font-bold text-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Chargement...
            </span>
          ) : (
            '🎮 Commencer à jouer'
          )}
        </button>

        <div className="mt-8 text-sm text-gray-500">
          <p>⚠️ Ce jeu nécessite une webcam et un microphone</p>
          <p className="mt-2">💡 Meilleure expérience sur ordinateur</p>
        </div>
      </div>
    </main>
  );
}
