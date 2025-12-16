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

export interface MatchFoundData {
  gameId: string;
  opponentId: string;
  isInitiator: boolean;
}

export interface GameEndData {
  gameId: string;
  result: 'win' | 'lose';
  winnerId: string;
}

export interface QueueStatusData {
  inQueue: boolean;
  queueSize: number;
}

export type GameStatus = 'idle' | 'searching' | 'matched' | 'playing' | 'ended';
