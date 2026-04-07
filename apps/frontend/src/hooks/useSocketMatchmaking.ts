import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export enum SocketEvents {
  JOIN_QUEUE = 'join_queue',
  LEAVE_QUEUE = 'leave_queue',
  MATCH_FOUND = 'match_found',
  QUEUE_STATUS = 'queue_status',
  GAME_START = 'game_start',
  PLAYER_LAUGHED = 'player_laughed',
  QUIT_GAME = 'quit_game',
  GAME_END = 'game_end',
  OPPONENT_LEFT = 'opponent_left',
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

interface GameEndData {
  gameId: string;
  result: 'win' | 'lose';
}

interface UseSocketMatchmakingOptions {
  onMatchFound?: (data: MatchFoundData) => void;
  onGameStart?: (gameId: string) => void;
  onGameEnd?: (data: GameEndData) => void;
  onOpponentLeft?: () => void;
  onError?: (message: string) => void;
}

export function useSocketMatchmaking(options: UseSocketMatchmakingOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInQueue, setIsInQueue] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [matchData, setMatchData] = useState<MatchFoundData | null>(null);

  const onMatchFoundRef = useRef(options.onMatchFound);
  const onGameStartRef = useRef(options.onGameStart);
  const onGameEndRef = useRef(options.onGameEnd);
  const onOpponentLeftRef = useRef(options.onOpponentLeft);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onMatchFoundRef.current = options.onMatchFound;
    onGameStartRef.current = options.onGameStart;
    onGameEndRef.current = options.onGameEnd;
    onOpponentLeftRef.current = options.onOpponentLeft;
    onErrorRef.current = options.onError;
  }, [options.onMatchFound, options.onGameStart, options.onGameEnd, options.onOpponentLeft, options.onError]);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connecté au serveur de matchmaking');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Déconnecté du serveur de matchmaking');
      setIsConnected(false);
      setIsInQueue(false);
    });

    socket.on(SocketEvents.QUEUE_STATUS, (data: QueueStatusData) => {
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
      onGameStartRef.current?.(data.gameId);
    });

    socket.on(SocketEvents.GAME_END, (data: GameEndData) => {
      console.log('🏁 Partie terminée:', data);
      onGameEndRef.current?.(data);
    });

    socket.on(SocketEvents.OPPONENT_LEFT, () => {
      console.log('🚪 Adversaire déconnecté');
      onOpponentLeftRef.current?.();
    });

    socket.on(SocketEvents.ERROR, (data: { message: string }) => {
      console.error('❌ Erreur socket:', data.message);
      onErrorRef.current?.(data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinQueue = (peerId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(SocketEvents.JOIN_QUEUE, { peerId });
    }
  };

  const leaveQueue = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(SocketEvents.LEAVE_QUEUE);
    }
  };

  const emitPlayerLaughed = (gameId: string) => {
    if (socketRef.current?.connected) {
      console.log('😂 Émission player_laughed pour game:', gameId);
      socketRef.current.emit(SocketEvents.PLAYER_LAUGHED, { gameId });
    }
  };

  const emitQuitGame = (gameId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(SocketEvents.QUIT_GAME, { gameId });
    }
  };

  return {
    isConnected,
    isInQueue,
    queueSize,
    matchData,
    joinQueue,
    leaveQueue,
    emitPlayerLaughed,
    emitQuitGame,
  };
}
