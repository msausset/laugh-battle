import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchmakingService } from './matchmaking.service';
import { SocketEvents } from '../types';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: true, // Accepter toutes les origines en développement
    credentials: true,
  },
})
export class MatchmakingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private matchmakingInterval: NodeJS.Timeout;

  constructor(
    private matchmakingService: MatchmakingService,
    private prisma: PrismaService,
  ) {
    // Run matchmaking every second
    this.matchmakingInterval = setInterval(() => {
      this.runMatchmaking();
    }, 1000);
  }

  async handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);

    // Create user in database
    await this.prisma.user.create({
      data: {
        socketId: client.id,
      },
    });
  }

  async handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected: ${client.id}`);

    // Remove from queue
    this.matchmakingService.removeFromQueue(client.id);

    // Clean up user from database
    try {
      await this.prisma.user.delete({
        where: { socketId: client.id },
      });
    } catch (error) {
      // User might not exist
    }
  }

  @SubscribeMessage(SocketEvents.JOIN_QUEUE)
  async handleJoinQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { peerId: string },
  ) {
    try {
      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: { socketId: client.id },
      });

      if (!user) {
        client.emit(SocketEvents.ERROR, { message: 'User not found' });
        return;
      }

      // Update user with peerId
      await this.prisma.user.update({
        where: { id: user.id },
        data: { peerId: data.peerId },
      });

      // Add to queue
      this.matchmakingService.addToQueue(client.id, user.id, data.peerId);

      // Send queue status
      client.emit(SocketEvents.QUEUE_STATUS, {
        inQueue: true,
        queueSize: this.matchmakingService.getQueueSize(),
      });
    } catch (error) {
      console.error('Error joining queue:', error);
      client.emit(SocketEvents.ERROR, { message: 'Failed to join queue' });
    }
  }

  @SubscribeMessage(SocketEvents.LEAVE_QUEUE)
  handleLeaveQueue(@ConnectedSocket() client: Socket) {
    this.matchmakingService.removeFromQueue(client.id);

    client.emit(SocketEvents.QUEUE_STATUS, {
      inQueue: false,
      queueSize: this.matchmakingService.getQueueSize(),
    });
  }

  private async runMatchmaking() {
    const match = await this.matchmakingService.findMatch();

    if (match) {
      // Notify both players with their opponent's Peer ID
      this.server.to(match.player1.socketId).emit(SocketEvents.MATCH_FOUND, {
        gameId: match.gameId,
        opponentId: match.player2.peerId, // Utiliser le Peer ID au lieu du User ID
        isInitiator: true, // Player 1 will initiate WebRTC connection
      });

      this.server.to(match.player2.socketId).emit(SocketEvents.MATCH_FOUND, {
        gameId: match.gameId,
        opponentId: match.player1.peerId, // Utiliser le Peer ID au lieu du User ID
        isInitiator: false,
      });

      // Start game after a short delay
      setTimeout(() => {
        this.server.to(match.player1.socketId).emit(SocketEvents.GAME_START, {
          gameId: match.gameId,
        });

        this.server.to(match.player2.socketId).emit(SocketEvents.GAME_START, {
          gameId: match.gameId,
        });
      }, 1000);
    }
  }
}
