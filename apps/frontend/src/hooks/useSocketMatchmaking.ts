import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export enum SocketEvents {
  // Matchmaking
  JOIN_QUEUE = 'join_queue',
  LEAVE_QUEUE = 'leave_queue',
  MATCH_FOUND = 'match_found',
  QUEUE_STATUS = 'queue_status',

  // Game
  GAME_START = 'game_start',

  // Connection
  ERROR = 'error',
}

interface MatchFoundData {
  gameId: string;
  opponentId: string;
  isInitiator: boolean;
}

interface QueueStatusData {
  inQueue: boolean;
  queueSize: number;
}

interface UseSocketMatchmakingOptions {
  onMatchFound?: (data: MatchFoundData) => void;
  onGameStart?: (gameId: string) => void;
  onError?: (message: string) => void;
}

export function useSocketMatchmaking(options: UseSocketMatchmakingOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInQueue, setIsInQueue] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [matchData, setMatchData] = useState<MatchFoundData | null>(null);

  // Stocker les callbacks dans des refs pour éviter les reconnexions
  const onMatchFoundRef = useRef(options.onMatchFound);
  const onGameStartRef = useRef(options.onGameStart);
  const onErrorRef = useRef(options.onError);

  // Mettre à jour les refs quand les callbacks changent
  useEffect(() => {
    onMatchFoundRef.current = options.onMatchFound;
    onGameStartRef.current = options.onGameStart;
    onErrorRef.current = options.onError;
  }, [options.onMatchFound, options.onGameStart, options.onError]);

  useEffect(() => {
    // Créer la connexion socket
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Événements de connexion
    socket.on('connect', () => {
      console.log('✅ Connecté au serveur de matchmaking');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Déconnecté du serveur de matchmaking');
      setIsConnected(false);
      setIsInQueue(false);
    });

    // Événements de matchmaking
    socket.on(SocketEvents.QUEUE_STATUS, (data: QueueStatusData) => {
      console.log('📊 Statut de la queue:', data);
      setIsInQueue(data.inQueue);
      setQueueSize(data.queueSize);
    });

    socket.on(SocketEvents.MATCH_FOUND, (data: MatchFoundData) => {
      console.log('🎮 Match trouvé!', data);
      setMatchData(data);
      setIsInQueue(false);
      onMatchFoundRef.current?.(data);
    });

    socket.on(SocketEvents.GAME_START, (data: { gameId: string }) => {
      console.log('🎮 La partie commence!', data);
      onGameStartRef.current?.(data.gameId);
    });

    socket.on(SocketEvents.ERROR, (data: { message: string }) => {
      console.error('❌ Erreur socket:', data.message);
      onErrorRef.current?.(data.message);
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []); // Pas de dépendances - on se connecte une seule fois

  const joinQueue = () => {
    if (socketRef.current?.connected) {
      console.log('🔍 Rejoindre la queue de matchmaking...');
      socketRef.current.emit(SocketEvents.JOIN_QUEUE);
    } else {
      console.error('❌ Socket non connecté');
    }
  };

  const leaveQueue = () => {
    if (socketRef.current?.connected) {
      console.log('🚪 Quitter la queue de matchmaking...');
      socketRef.current.emit(SocketEvents.LEAVE_QUEUE);
    }
  };

  return {
    isConnected,
    isInQueue,
    queueSize,
    matchData,
    joinQueue,
    leaveQueue,
    socket: socketRef.current,
  };
}
