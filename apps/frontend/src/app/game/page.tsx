'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePeerMatchmaking } from '@/hooks/usePeerMatchmaking';
import { useSocketMatchmaking } from '@/hooks/useSocketMatchmaking';
import VideoPlayer from '@/components/VideoPlayer';
import GameControls from '@/components/GameControls';

type ScreenMode = 'menu' | 'waiting' | 'searching' | 'playing';

export default function GamePage() {
  const router = useRouter();
  const [screenMode, setScreenMode] = useState<ScreenMode>('menu');
  const [peerIdInput, setPeerIdInput] = useState('');
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);

  const {
    localStream,
    remoteStream,
    isConnected,
    myPeerId,
    roomCode,
    createRoom,
    joinRoom,
    disconnect,
  } = usePeerMatchmaking({
    onMatchFound: () => {
      console.log('🎮 Match trouvé!');
    },
    onConnectionEstablished: () => {
      console.log('✅ Connexion établie!');
      setScreenMode('playing');
    },
  });

  // Hook pour le matchmaking aléatoire via WebSocket
  const {
    isInQueue,
    queueSize,
    joinQueue,
    leaveQueue,
  } = useSocketMatchmaking({
    onMatchFound: (data) => {
      console.log('🎮 Match trouvé via socket!', data);
      console.log('Mon Peer ID:', myPeerId);
      console.log('Opponent ID:', data.opponentId);

      // Pour le matchmaking aléatoire, on utilise l'opponentId comme PeerID
      // L'initiateur crée la room et attend
      if (data.isInitiator) {
        console.log('🎯 Je suis l\'initiateur, création de la room');
        createRoom();
        setScreenMode('waiting');
      } else {
        // L'autre joueur rejoint la room de l'initiateur
        console.log('🔗 Je rejoins la room de l\'adversaire');
        // On attend un peu que l'initiateur crée sa room
        setTimeout(() => {
          joinRoom(data.opponentId);
          setScreenMode('waiting');
        }, 2000);
      }
    },
    onGameStart: (gameId) => {
      console.log('🎮 Partie démarrée:', gameId);
    },
    onError: (message) => {
      alert(`Erreur: ${message}`);
      setScreenMode('menu');
    },
  });

  const handleCreateRoom = () => {
    createRoom();
    setScreenMode('waiting');
  };

  const handleJoinRoom = () => {
    if (!peerIdInput.trim()) {
      alert('Veuillez entrer un Peer ID');
      return;
    }
    joinRoom(peerIdInput.trim());
    setScreenMode('waiting');
  };

  const handleRandomMatchmaking = () => {
    if (!myPeerId) {
      console.error('❌ Peer ID non disponible');
      return;
    }
    console.log('🎲 Démarrage du matchmaking aléatoire...');
    joinQueue(myPeerId);
    setScreenMode('searching');
  };

  const handleILaughed = () => {
    console.log('😂 J\'ai ri!');
    setGameResult('lose');
    setTimeout(() => {
      disconnect();
      router.push('/');
    }, 3000);
  };

  const handleLeaveGame = () => {
    disconnect();
    router.push('/');
  };

  // Log pour tracer les changements de remoteStream
  useEffect(() => {
    console.log('🔄 [GamePage] remoteStream changé:', {
      hasStream: !!remoteStream,
      streamId: remoteStream?.id,
      active: remoteStream?.active,
      videoTracks: remoteStream?.getVideoTracks().length ?? 0,
      audioTracks: remoteStream?.getAudioTracks().length ?? 0,
    });
  }, [remoteStream]);

  // Log pour tracer les changements de localStream
  useEffect(() => {
    console.log('🔄 [GamePage] localStream changé:', {
      hasStream: !!localStream,
      streamId: localStream?.id,
      active: localStream?.active,
      videoTracks: localStream?.getVideoTracks().length ?? 0,
      audioTracks: localStream?.getAudioTracks().length ?? 0,
    });
  }, [localStream]);

  // Menu principal - Créer ou rejoindre
  if (screenMode === 'menu') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            😂 Matchmaking
          </h1>

          <div className="space-y-4">
            {/* Matchmaking aléatoire */}
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

            {/* Créer une room */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-3">Créer une partie privée</h2>
              <p className="text-gray-400 text-sm mb-4">
                Créez une room et partagez votre Peer ID avec un ami
              </p>
              {myPeerId && (
                <div className="mb-4 p-3 bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Votre Peer ID:</p>
                  <p className="text-sm font-mono text-primary-400 break-all">
                    {myPeerId}
                  </p>
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

            {/* Rejoindre une room */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-3">Rejoindre une partie</h2>
              <p className="text-gray-400 text-sm mb-4">
                Entrez le Peer ID de votre adversaire
              </p>
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

  // Écran de recherche de match aléatoire
  if (screenMode === 'searching') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-75"></div>
              <div className="relative flex items-center justify-center w-32 h-32 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full">
                <span className="text-5xl">🎲</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-4">
              Recherche d'un adversaire...
            </h1>

            <div className="mb-6 p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm mb-2">
                Joueurs en recherche
              </p>
              <p className="text-4xl font-bold text-primary-400">
                {isInQueue ? queueSize + 1 : queueSize}
              </p>
            </div>

            <div className="space-y-2 text-gray-400 text-sm">
              <p className="flex items-center justify-center gap-2">
                <span className="animate-pulse">🟢</span>
                Connecté au serveur
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="animate-pulse">🔍</span>
                Recherche en cours...
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              leaveQueue();
              setScreenMode('menu');
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
          >
            Annuler la recherche
          </button>
        </div>
      </main>
    );
  }

  // Écran d'attente
  if (screenMode === 'waiting') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-75"></div>
              <div className="relative flex items-center justify-center w-32 h-32 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full">
                <span className="text-5xl">🔍</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-4">
              {roomCode ? 'En attente d\'un adversaire...' : 'Connexion en cours...'}
            </h1>

            {roomCode && myPeerId && (
              <div className="mb-6 p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
                <p className="text-sm text-gray-400 mb-2">
                  Partagez ce Peer ID avec votre adversaire:
                </p>
                <div className="p-3 bg-gray-900 rounded-lg mb-3">
                  <p className="text-lg font-mono text-primary-400 break-all">
                    {myPeerId}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(myPeerId);
                    alert('Peer ID copié!');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
                >
                  📋 Copier le Peer ID
                </button>
              </div>
            )}

            <div className="space-y-2 text-gray-400 text-sm">
              <p className="flex items-center justify-center gap-2">
                <span className="animate-pulse">🟡</span>
                Caméra et micro activés
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              disconnect();
              setScreenMode('menu');
            }}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            Annuler
          </button>
        </div>
      </main>
    );
  }

  // Écran de jeu
  return (
    <main className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">😂 Laugh Battle</h1>
        <div className="flex gap-4 items-center">
          {isConnected && (
            <span className="text-green-400">🟢 Connecté</span>
          )}
          {gameResult && (
            <span className="text-xl font-bold">
              {gameResult === 'win' ? '🎉 Vous avez gagné!' : '😂 Vous avez perdu!'}
            </span>
          )}
          <button
            onClick={handleLeaveGame}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            Quitter
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Remote Player (Opponent) */}
        <VideoPlayer
          stream={remoteStream}
          label="Adversaire"
          isMuted={false}
          isLoading={!remoteStream}
        />

        {/* Local Player (You) */}
        <VideoPlayer
          stream={localStream}
          label="Vous"
          isMuted={true}
          isLoading={!localStream}
          mirror={true}
        />
      </div>

      {/* Game Controls */}
      {!gameResult && (
        <GameControls onILaughed={handleILaughed} />
      )}
    </main>
  );
}
