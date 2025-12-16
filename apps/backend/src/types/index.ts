export enum SocketEvents {
  // Matchmaking
  JOIN_QUEUE = 'join_queue',
  LEAVE_QUEUE = 'leave_queue',
  MATCH_FOUND = 'match_found',
  QUEUE_STATUS = 'queue_status',

  // WebRTC Signaling
  OFFER = 'offer',
  ANSWER = 'answer',
  ICE_CANDIDATE = 'ice_candidate',

  // Game
  GAME_START = 'game_start',
  PLAYER_LAUGHED = 'player_laughed',
  GAME_END = 'game_end',
  OPPONENT_LEFT = 'opponent_left',
  REMATCH_REQUEST = 'rematch_request',
  REMATCH_ACCEPTED = 'rematch_accepted',
  REMATCH_DECLINED = 'rematch_declined',

  // Connection
  DISCONNECT = 'disconnect',
  ERROR = 'error',
}

export interface QueuePlayer {
  socketId: string;
  userId: string;
  joinedAt: Date;
}

export interface Match {
  gameId: string;
  player1: QueuePlayer;
  player2: QueuePlayer;
}

export interface SignalData {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  from: string;
  to: string;
}

export interface GameState {
  gameId: string;
  player1Id: string;
  player2Id: string;
  player1SocketId: string;
  player2SocketId: string;
  status: 'playing' | 'finished';
  winnerId?: string;
  startedAt: Date;
}
