import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { SocketEvents } from '../types';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  constructor(private gameService: GameService) {}

  @SubscribeMessage(SocketEvents.PLAYER_LAUGHED)
  async handlePlayerLaughed(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ) {
    const game = this.gameService.getGame(data.gameId);
    if (!game || game.status !== 'playing') {
      return;
    }

    // Determine winner (the one who didn't laugh)
    let winnerId: string;
    let loserSocketId: string;
    let winnerSocketId: string;

    if (game.player1SocketId === client.id) {
      // Player 1 laughed, Player 2 wins
      winnerId = game.player2Id;
      loserSocketId = game.player1SocketId;
      winnerSocketId = game.player2SocketId;
    } else {
      // Player 2 laughed, Player 1 wins
      winnerId = game.player1Id;
      loserSocketId = game.player2SocketId;
      winnerSocketId = game.player1SocketId;
    }

    // End the game
    await this.gameService.endGame(data.gameId, winnerId);

    // Notify both players
    this.server.to(winnerSocketId).emit(SocketEvents.GAME_END, {
      gameId: data.gameId,
      result: 'win',
      winnerId,
    });

    this.server.to(loserSocketId).emit(SocketEvents.GAME_END, {
      gameId: data.gameId,
      result: 'lose',
      winnerId,
    });

    console.log(`😂 Player ${client.id} laughed in game ${data.gameId}`);
    console.log(`🏆 Winner: ${winnerId}`);
  }

  @SubscribeMessage(SocketEvents.REMATCH_REQUEST)
  handleRematchRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string; opponentSocketId: string },
  ) {
    this.server.to(data.opponentSocketId).emit(SocketEvents.REMATCH_REQUEST, {
      from: client.id,
    });
  }

  @SubscribeMessage(SocketEvents.REMATCH_ACCEPTED)
  handleRematchAccepted(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { opponentSocketId: string },
  ) {
    this.server.to(data.opponentSocketId).emit(SocketEvents.REMATCH_ACCEPTED);
  }

  @SubscribeMessage(SocketEvents.REMATCH_DECLINED)
  handleRematchDeclined(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { opponentSocketId: string },
  ) {
    this.server.to(data.opponentSocketId).emit(SocketEvents.REMATCH_DECLINED);
  }
}
