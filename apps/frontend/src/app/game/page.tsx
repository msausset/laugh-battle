'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePeerMatchmaking } from '@/hooks/usePeerMatchmaking';
import { useSocketMatchmaking } from '@/hooks/useSocketMatchmaking';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import VideoPlayer from '@/components/VideoPlayer';

type ScreenMode = 'menu' | 'training' | 'waiting' | 'searching' | 'playing' | 'result';
type TrainingPhase = 'idle' | 'running' | 'success' | 'failed';

const CHALLENGE_DURATION = 30;

export default function GamePage() {
  const router = useRouter();
  const [screenMode, setScreenMode] = useState<ScreenMode>('menu');
  const [peerIdInput, setPeerIdInput] = useState('');
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  const gameIdRef = useRef<string | null>(null);
  const isLeavingRef = useRef(false);

  // --- États mode entraînement ---
  const [trainingPhase, setTrainingPhase] = useState<TrainingPhase>('idle');
  const [trainingTimeLeft, setTrainingTimeLeft] = useState(CHALLENGE_DURATION);
  const [detectionEnabled, setDetectionEnabled] = useState(true);
  const trainingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        if (isLeavingRef.current) return;
        setGameResult(data.result);
        setScreenMode('result');
        disconnect();
      },
      onOpponentLeft: () => {
        if (connectionLostTimerRef.current) {
          clearTimeout(connectionLostTimerRef.current);
          connectionLostTimerRef.current = null;
        }
        disconnect();
        gameIdRef.current = null;
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

  // Callbacks spécifiques au mode entraînement
  const handleTrainingLaugh = useCallback(() => {
    if (trainingPhase !== 'running') return;
    if (trainingTimerRef.current) clearInterval(trainingTimerRef.current);
    setTrainingPhase('failed');
  }, [trainingPhase]);

  const resetTrainingDetection = useCallback(() => {
    setDetectionEnabled(false);
    setTimeout(() => setDetectionEnabled(true), 50);
  }, []);

  const startChallenge = useCallback(() => {
    setTrainingPhase('running');
    setTrainingTimeLeft(CHALLENGE_DURATION);
    resetTrainingDetection();

    trainingTimerRef.current = setInterval(() => {
      setTrainingTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(trainingTimerRef.current!);
          setTrainingPhase('success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [resetTrainingDetection]);

  // Nettoyer le timer entraînement si on quitte le mode
  useEffect(() => {
    if (screenMode !== 'training') {
      if (trainingTimerRef.current) clearInterval(trainingTimerRef.current);
      setTrainingPhase('idle');
      setTrainingTimeLeft(CHALLENGE_DURATION);
    }
  }, [screenMode]);

  const isTrainingMode = screenMode === 'training';

  const { isModelLoaded, smileConfidence, faceDetected, mouthDetected, mouthVisibilityScore } = useFaceDetection({
    stream: localStream,
    onLaughDetected: isTrainingMode ? handleTrainingLaugh : handleLaughDetected,
    onNoFaceDetected: isTrainingMode
      ? handleTrainingLaugh
      : handleLaughDetected,
    enabled: screenMode === 'playing' || (isTrainingMode && detectionEnabled),
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
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white transition">
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
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white transition">
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

            {/* Mode entraînement */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm rounded-xl p-6 border border-green-700">
              <h2 className="text-xl font-semibold mb-3">🏋️ Mode Entraînement</h2>
              <p className="text-gray-400 text-sm mb-4">
                Teste ta caméra, ajuste ton éclairage et entraîne-toi à garder ton sérieux
              </p>
              <button
                onClick={() => setScreenMode('training')}
                className="w-full px-6 py-3 bg-green-700 hover:bg-green-600 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                🎯 S&apos;entraîner
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

            <button onClick={() => router.push('/')} className="mt-4 text-gray-400 hover:text-white transition">
              ← Retour à l&apos;accueil
            </button>
          </div>
        </div>
      </main>
    );
  }

  // --- MODE ENTRAÎNEMENT ---
  if (screenMode === 'training') {
    const detectionOk = isModelLoaded && faceDetected;
    const smileColor =
      smileConfidence > 75 ? '#ef4444' : smileConfidence > 40 ? '#f59e0b' : '#22c55e';

    return (
      <main className="min-h-screen flex flex-col p-4 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setScreenMode('menu')}
            className="text-gray-400 hover:text-white transition text-sm"
          >
            ← Retour
          </button>
          <h1 className="text-2xl font-bold">🏋️ Mode Entraînement</h1>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Colonne gauche : caméra */}
          <div className="flex flex-col gap-4">
            <VideoPlayer
              stream={localStream}
              label="Votre caméra"
              isMuted={true}
              isLoading={!localStream}
              mirror={true}
            />

            {/* Jauge de sourire */}
            <div className={`rounded-xl p-4 border transition-colors ${
              isModelLoaded && (!faceDetected || !mouthDetected)
                ? 'bg-red-900/40 border-red-500 animate-pulse'
                : 'bg-gray-800/50 border-gray-700'
            }`}>
              {!isModelLoaded ? (
                <p className="text-sm text-gray-400 text-center">⏳ Chargement de la détection...</p>
              ) : (
                <div className="space-y-3">
                  {/* Visage */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">👤 Visage</span>
                    <span className={faceDetected ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                      {faceDetected ? '✓ Détecté' : '✗ Non détecté'}
                    </span>
                  </div>

                  {/* Visibilité bouche (informatif) */}
                  {faceDetected && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-400">👄 Visibilité bouche</span>
                        <span className={
                          mouthVisibilityScore >= 50 ? 'text-green-400 font-semibold' :
                          mouthVisibilityScore >= 25 ? 'text-yellow-400 font-semibold' :
                          'text-red-400 font-semibold'
                        }>
                          {mouthVisibilityScore >= 50 ? '✓ Bonne' :
                           mouthVisibilityScore >= 25 ? '⚠ Faible' : '✗ Mauvaise'}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-200"
                          style={{
                            width: `${mouthVisibilityScore}%`,
                            backgroundColor: mouthVisibilityScore >= 50 ? '#22c55e' : mouthVisibilityScore >= 25 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                      {mouthVisibilityScore < 40 && (
                        <p className="text-xs text-yellow-500 mt-1">
                          💡 Améliore l&apos;éclairage ou centre ton visage
                        </p>
                      )}
                    </div>
                  )}

                  {/* Sourire */}
                  {detectionOk && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-400">😊 Sourire</span>
                        <span className="font-semibold" style={{ color: smileColor }}>
                          {smileConfidence}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-200"
                          style={{ width: `${smileConfidence}%`, backgroundColor: smileColor }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Colonne droite : conseils + défi */}
          <div className="flex flex-col gap-4">
            {/* Conseils setup */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700">
              <h2 className="font-semibold mb-4 text-white">💡 Conseils pour un bon setup</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-2xl leading-none">☀️</span>
                  <div>
                    <p className="text-white font-medium">Éclairage</p>
                    <p className="text-gray-400">Place-toi face à une fenêtre ou une lampe. Évite d&apos;avoir la lumière dans le dos (contre-jour).</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl leading-none">📏</span>
                  <div>
                    <p className="text-white font-medium">Distance</p>
                    <p className="text-gray-400">Ton visage doit occuper environ un tiers de l&apos;écran. Ni trop loin, ni trop proche.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl leading-none">🎯</span>
                  <div>
                    <p className="text-white font-medium">Cadrage</p>
                    <p className="text-gray-400">Centre ton visage, bouche bien visible. Ne penche pas trop la tête.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl leading-none">🌑</span>
                  <div>
                    <p className="text-white font-medium">Fond</p>
                    <p className="text-gray-400">Un fond uniforme (mur) améliore la détection. Évite les fonds très chargés.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Défi sérieux */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700">
              <h2 className="font-semibold mb-2 text-white">🏆 Défi : Tenir {CHALLENGE_DURATION}s sans rire</h2>
              <p className="text-gray-400 text-sm mb-4">
                Garde ton sérieux pendant {CHALLENGE_DURATION} secondes. Le moindre sourire met fin au défi.
              </p>

              {trainingPhase === 'idle' && (
                <button
                  onClick={startChallenge}
                  disabled={!detectionOk}
                  className="w-full px-6 py-3 bg-green-700 hover:bg-green-600 rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {detectionOk ? '▶ Commencer le défi' : 'Détection non prête...'}
                </button>
              )}

              {trainingPhase === 'running' && (
                <div className="text-center">
                  <div className="text-6xl font-bold text-white mb-2">{trainingTimeLeft}</div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(trainingTimeLeft / CHALLENGE_DURATION) * 100}%` }}
                    />
                  </div>
                  <p className="text-gray-400 text-sm">Garde ton sérieux... 😐</p>
                  <button
                    onClick={() => {
                      if (trainingTimerRef.current) clearInterval(trainingTimerRef.current);
                      setTrainingPhase('idle');
                    }}
                    className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition"
                  >
                    Annuler
                  </button>
                </div>
              )}

              {trainingPhase === 'success' && (
                <div className="text-center">
                  <div className="text-5xl mb-2">🏆</div>
                  <p className="text-green-400 font-bold text-lg mb-1">Excellent !</p>
                  <p className="text-gray-400 text-sm mb-4">Tu as tenu {CHALLENGE_DURATION} secondes sans rire.</p>
                  <button
                    onClick={() => { resetTrainingDetection(); setTrainingPhase('idle'); }}
                    className="w-full px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg font-semibold transition"
                  >
                    Recommencer
                  </button>
                </div>
              )}

              {trainingPhase === 'failed' && (
                <div className="text-center">
                  <div className="text-5xl mb-2">😂</div>
                  <p className="text-red-400 font-bold text-lg mb-1">Tu as craqué !</p>
                  <p className="text-gray-400 text-sm mb-4">
                    Il te restait {trainingTimeLeft}s. Ajuste ton éclairage et réessaie.
                  </p>
                  <button
                    onClick={() => { resetTrainingDetection(); setTrainingPhase('idle'); }}
                    className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition"
                  >
                    Réessayer
                  </button>
                </div>
              )}
            </div>
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
          <h1 className="text-3xl font-bold mb-4">Recherche d&apos;un adversaire...</h1>
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
          <div className="flex flex-col gap-3">
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
            {!isWin && (
              <button
                onClick={() => { setGameResult(null); setScreenMode('training'); }}
                className="px-6 py-3 bg-green-800 hover:bg-green-700 rounded-lg font-semibold transition text-sm"
              >
                🏋️ S&apos;entraîner d&apos;abord
              </button>
            )}
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
        isModelLoaded && !faceDetected
          ? 'bg-red-900/40 border-red-500 animate-pulse'
          : 'bg-gray-800/50 border-gray-700'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            {!isModelLoaded ? (
              <p className="text-sm text-gray-400">⏳ Chargement de la détection...</p>
            ) : !faceDetected ? (
              <p className="text-sm text-red-400 font-semibold">⚠️ Visage non détecté — reviens dans le cadre !</p>
            ) : (
              <p className="text-sm text-gray-400">👁️ Détection du sourire active</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {!isConnected ? '🔴 Connexion perdue...' : 'Garde ton sérieux ! Le premier qui rit perd.'}
            </p>
          </div>
          {isModelLoaded && faceDetected && (
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
