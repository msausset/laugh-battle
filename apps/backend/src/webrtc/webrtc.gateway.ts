import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../types';

@WebSocketGateway({
  cors: {
    origin: true, // Accepter toutes les origines en développement
    credentials: true,
  },
})
export class WebrtcGateway {
  @WebSocketServer()
  server: Server;

  // Store game rooms: gameId -> [player1SocketId, player2SocketId]
  private gameRooms = new Map<string, Set<string>>();

  @SubscribeMessage(SocketEvents.OFFER)
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { offer: any; gameId: string },
  ) {
    console.log(`📡 Received offer from ${client.id} for game ${data.gameId}`);

    // Join game room
    if (!this.gameRooms.has(data.gameId)) {
      this.gameRooms.set(data.gameId, new Set());
    }
    this.gameRooms.get(data.gameId)!.add(client.id);

    // Forward offer to other player in the room
    const room = this.gameRooms.get(data.gameId)!;
    room.forEach(socketId => {
      if (socketId !== client.id) {
        this.server.to(socketId).emit(SocketEvents.OFFER, {
          offer: data.offer,
          from: client.id,
        });
        console.log(`📡 Forwarded offer to ${socketId}`);
      }
    });
  }

  @SubscribeMessage(SocketEvents.ANSWER)
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { answer: any; gameId: string },
  ) {
    console.log(`📡 Received answer from ${client.id} for game ${data.gameId}`);

    // Join game room
    if (!this.gameRooms.has(data.gameId)) {
      this.gameRooms.set(data.gameId, new Set());
    }
    this.gameRooms.get(data.gameId)!.add(client.id);

    // Forward answer to other player in the room
    const room = this.gameRooms.get(data.gameId)!;
    room.forEach(socketId => {
      if (socketId !== client.id) {
        this.server.to(socketId).emit(SocketEvents.ANSWER, {
          answer: data.answer,
          from: client.id,
        });
        console.log(`📡 Forwarded answer to ${socketId}`);
      }
    });
  }

  @SubscribeMessage(SocketEvents.ICE_CANDIDATE)
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { candidate: any; gameId: string },
  ) {
    console.log(`🧊 Received ICE candidate from ${client.id}`);

    // Forward ICE candidate to other player in the room
    const room = this.gameRooms.get(data.gameId);
    if (room) {
      room.forEach(socketId => {
        if (socketId !== client.id) {
          this.server.to(socketId).emit(SocketEvents.ICE_CANDIDATE, {
            candidate: data.candidate,
            from: client.id,
          });
        }
      });
    }
  }

  // Clean up game room when players disconnect
  handlePlayerDisconnect(socketId: string) {
    this.gameRooms.forEach((players, gameId) => {
      if (players.has(socketId)) {
        players.delete(socketId);

        // Notify other player
        players.forEach(otherSocketId => {
          this.server.to(otherSocketId).emit(SocketEvents.OPPONENT_LEFT);
        });

        // Clean up empty rooms
        if (players.size === 0) {
          this.gameRooms.delete(gameId);
        }
      }
    });
  }
}
