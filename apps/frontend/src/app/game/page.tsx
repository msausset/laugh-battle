'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePeerMatchmaking } from '@/hooks/usePeerMatchmaking';
import { useSocketMatchmaking } from '@/hooks/useSocketMatchmaking';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import VideoPlayer from '@/components/VideoPlayer';

type ScreenMode = 'menu' | 'waiting' | 'searching' | 'playing' | 'result';

export default function GamePage() {
  const router = useRouter();
  const [screenMode, setScreenMode] = useState<ScreenMode>('menu');
  const [peerIdInput, setPeerIdInput] = useState('');
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  const gameIdRef = useRef<string | null>(null);
  const isLeavingRef = useRef(false);

  const {
    localStream,
    remoteStream,
    isConnected,
    myPeerId,
    roomCode,
    mediaPermissionStatus,
    createRoom,
    joinRoom,
    disconnect,
  } = usePeerMatchmaking({
    onConnectionEstablished: () => {
      setScreenMode('playing');
    },
  });

  const { isInQueue, queueSize, joinQueue, leaveQueue, emitPlayerLaughed, emitQuitGame } =
    useSocketMatchmaking({
      onMatchFound: (data) => {
        gameIdRef.current = data.gameId;
        isLeavingRef.current = false;
        if (data.isInitiator) {
          createRoom();
          setScreenMode('waiting');
        } else {
          setTimeout(() => {
            joinRoom(data.opponentId);
            setScreenMode('waiting');
          }, 2000);
        }
      },
      onGameEnd: (data) => {
        if (isLeavingRef.current) return; // on a déjà quitté, ignorer
        setGameResult(data.result);
        setScreenMode('result');
        disconnect();
      },
      onOpponentLeft: () => {
        // Annuler le timer "connexion perdue" pour ne pas déclencher une défaite
        if (connectionLostTimerRef.current) {
          clearTimeout(connectionLostTimerRef.current);
          connectionLostTimerRef.current = null;
        }
        disconnect();
        gameIdRef.current = null;
        // Victoire automatique + retour en matchmaking
        setGameResult('win');
        setScreenMode('result');
      },
      onError: (message) => {
        alert(`Erreur: ${message}`);
        setScreenMode('menu');
      },
    });

  const handleLaughDetected = useCallback(() => {
    if (gameIdRef.current) {
      emitPlayerLaughed(gameIdRef.current);
    }
  }, [emitPlayerLaughed]);

  const { isModelLoaded, smileConfidence, faceDetected, mouthDetected } = useFaceDetection({
    stream: localStream,
    onLaughDetected: handleLaughDetected,
    onNoFaceDetected: handleLaughDetected,
    enabled: screenMode === 'playing',
  });

  // Connexion perdue pendant 2s → défaite
  const connectionLostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (screenMode !== 'playing') return;

    if (!isConnected) {
      connectionLostTimerRef.current = setTimeout(() => {
        handleLaughDetected();
      }, 2000);
    } else {
      if (connectionLostTimerRef.current) {
        clearTimeout(connectionLostTimerRef.current);
        connectionLostTimerRef.current = null;
      }
    }

    return () => {
      if (connectionLostTimerRef.current) {
        clearTimeout(connectionLostTimerRef.current);
        connectionLostTimerRef.current = null;
      }
    };
  }, [isConnected, screenMode, handleLaughDetected]);

  const handleRandomMatchmaking = () => {
    if (!myPeerId) return;
    joinQueue(myPeerId);
    setScreenMode('searching');
  };

  const handleCreateRoom = () => {
    createRoom();
    setScreenMode('waiting');
  };

  const handleJoinRoom = () => {
    if (!peerIdInput.trim()) return;
    joinRoom(peerIdInput.trim());
    setScreenMode('waiting');
  };

  // --- PERMISSIONS EN ATTENTE ---
  if (screenMode === 'menu' && mediaPermissionStatus === 'pending') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-yellow-500 rounded-full animate-ping opacity-50"></div>
            <div className="relative flex items-center justify-center w-32 h-32 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full">
              <span className="text-5xl">📷</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">Autorisation requise</h1>
          <p className="text-gray-400 mb-6">
            Autorise l&apos;accès à ta <span className="text-white font-semibold">caméra</span> et à ton{' '}
            <span className="text-white font-semibold">microphone</span> dans la fenêtre de ton navigateur pour accéder au matchmaking.
          </p>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-yellow-700/50 mb-6">
            <p className="text-sm text-yellow-400 animate-pulse">⏳ En attente de l&apos;autorisation...</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition"
          >
            ← Retour à l&apos;accueil
          </button>
        </div>
      </main>
    );
  }

  // --- PERMISSIONS REFUSÉES ---
  if (screenMode === 'menu' && mediaPermissionStatus === 'denied') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-9xl mb-6">🚫</div>
          <h1 className="text-3xl font-bold mb-4 text-red-400">Accès refusé</h1>
          <p className="text-gray-400 mb-6">
            La caméra ou le microphone n&apos;est pas autorisé. Le matchmaking est impossible sans ces périphériques.
          </p>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-red-700/50 mb-6 text-left">
            <p className="font-semibold text-white mb-3">Comment autoriser l&apos;accès :</p>
            <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
              <li>Clique sur l&apos;icône 🔒 ou 📷 dans la barre d&apos;adresse</li>
              <li>Autorise la caméra et le microphone</li>
              <li>Recharge la page</li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition mb-4 w-full"
          >
            🔄 Recharger la page
          </button>
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition"
          >
            ← Retour à l&apos;accueil
          </button>
        </div>
      </main>
    );
  }

  // --- MENU ---
  if (screenMode === 'menu') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            😂 Matchmaking
          </h1>

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/20 backdrop-blur-sm rounded-xl p-6 border-2 border-primary-500">
              <h2 className="text-xl font-semibold mb-3">🎲 Matchmaking Aléatoire</h2>
              <p className="text-gray-400 text-sm mb-4">
                Trouvez un adversaire aléatoire et commencez à jouer immédiatement
              </p>
              <button
                onClick={handleRandomMatchmaking}
                disabled={!myPeerId}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {myPeerId ? '🎮 Trouver un adversaire' : 'Chargement...'}
              </button>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-3">Créer une partie privée</h2>
              {myPeerId && (
                <div className="mb-4 p-3 bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Votre Peer ID :</p>
                  <p className="text-sm font-mono text-primary-400 break-all">{myPeerId}</p>
                </div>
              )}
              <button
                onClick={handleCreateRoom}
                disabled={!myPeerId}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {myPeerId ? 'Créer une room' : 'Chargement...'}
              </button>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-3">Rejoindre une partie</h2>
              <input
                type="text"
                value={peerIdInput}
                onChange={(e) => setPeerIdInput(e.target.value)}
                placeholder="Entrez le Peer ID"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg mb-4 focus:outline-none focus:border-primary-500 font-mono text-sm"
              />
              <button
                onClick={handleJoinRoom}
                disabled={!myPeerId || !peerIdInput.trim()}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rejoindre
              </button>
            </div>

            <button
              onClick={() => router.push('/')}
              className="mt-4 text-gray-400 hover:text-white transition"
            >
              ← Retour à l'accueil
            </button>
          </div>
        </div>
      </main>
    );
  }

  // --- RECHERCHE ---
  if (screenMode === 'searching') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-75"></div>
            <div className="relative flex items-center justify-center w-32 h-32 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full">
              <span className="text-5xl">🎲</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">Recherche d'un adversaire...</h1>
          <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Joueurs en recherche</p>
            <p className="text-4xl font-bold text-primary-400">{queueSize}</p>
          </div>
          <button
            onClick={() => { leaveQueue(); setScreenMode('menu'); }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
          >
            Annuler
          </button>
        </div>
      </main>
    );
  }

  // --- ATTENTE CONNEXION ---
  if (screenMode === 'waiting') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-75"></div>
            <div className="relative flex items-center justify-center w-32 h-32 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full">
              <span className="text-5xl">🔍</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">
            {roomCode ? "En attente d'un adversaire..." : 'Connexion en cours...'}
          </h1>
          {roomCode && myPeerId && (
            <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Partagez ce Peer ID :</p>
              <p className="text-lg font-mono text-primary-400 break-all">{myPeerId}</p>
              <button
                onClick={() => navigator.clipboard.writeText(myPeerId)}
                className="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
              >
                📋 Copier
              </button>
            </div>
          )}
          <button
            onClick={() => { disconnect(); setScreenMode('menu'); }}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            Annuler
          </button>
        </div>
      </main>
    );
  }

  // --- RÉSULTAT ---
  if (screenMode === 'result') {
    const isWin = gameResult === 'win';
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-9xl mb-6">{isWin ? '🏆' : '😂'}</div>
          <h1 className={`text-5xl font-bold mb-4 ${isWin ? 'text-yellow-400' : 'text-red-400'}`}>
            {isWin ? 'Victoire !' : 'Défaite !'}
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            {isWin
              ? "Ton adversaire n'a pas pu s'empêcher de rire !"
              : 'Tu as craqué ! Entraîne-toi à garder ton sérieux.'}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                gameIdRef.current = null;
                setGameResult(null);
                if (myPeerId) {
                  joinQueue(myPeerId);
                  setScreenMode('searching');
                } else {
                  setScreenMode('menu');
                }
              }}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition"
            >
              Rejouer
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              Accueil
            </button>
          </div>
        </div>
      </main>
    );
  }

  // --- JEU ---
  return (
    <main className="min-h-screen flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">😂 Laugh Battle</h1>
        <div className="flex gap-4 items-center">
          {isConnected && <span className="text-green-400">🟢 Connecté</span>}
          <button
            onClick={() => {
              isLeavingRef.current = true;
              if (gameIdRef.current) emitQuitGame(gameIdRef.current);
              disconnect();
              gameIdRef.current = null;
              setScreenMode('menu');
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            Quitter
          </button>

        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <VideoPlayer stream={remoteStream} label="Adversaire" isMuted={false} isLoading={!remoteStream} />
        <VideoPlayer stream={localStream} label="Vous" isMuted={true} isLoading={!localStream} mirror={true} />
      </div>

      {/* Indicateur de détection */}
      <div className={`backdrop-blur-sm rounded-xl p-4 border transition-colors ${
        isModelLoaded && (!faceDetected || !mouthDetected)
          ? 'bg-red-900/40 border-red-500 animate-pulse'
          : 'bg-gray-800/50 border-gray-700'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            {!isModelLoaded ? (
              <p className="text-sm text-gray-400">⏳ Chargement de la détection...</p>
            ) : !faceDetected ? (
              <p className="text-sm text-red-400 font-semibold">⚠️ Visage non détecté — reviens dans le cadre !</p>
            ) : !mouthDetected ? (
              <p className="text-sm text-red-400 font-semibold">⚠️ Bouche non visible — ne la cache pas !</p>
            ) : (
              <p className="text-sm text-gray-400">👁️ Détection du sourire active</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {!isConnected ? '🔴 Connexion perdue...' : 'Garde ton sérieux ! Le premier qui rit perd.'}
            </p>
          </div>
          {isModelLoaded && faceDetected && mouthDetected && (
            <div className="text-right">
              <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${smileConfidence}%`,
                    backgroundColor: smileConfidence > 75 ? '#ef4444' : smileConfidence > 40 ? '#f59e0b' : '#22c55e',
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Sourire : {smileConfidence}%</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
