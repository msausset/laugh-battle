import { Injectable } from '@nestjs/common';
import { QueuePlayer, Match } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchmakingService {
  private queue: QueuePlayer[] = [];

  constructor(private prisma: PrismaService) {}

  addToQueue(socketId: string, userId: string, peerId?: string): QueuePlayer {
    const player: QueuePlayer = {
      socketId,
      userId,
      peerId,
      joinedAt: new Date(),
    };

    this.queue.push(player);
    console.log(`✅ Player ${socketId} (Peer: ${peerId}) joined queue. Queue size: ${this.queue.length}`);

    return player;
  }

  removeFromQueue(socketId: string): void {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(p => p.socketId !== socketId);

    if (this.queue.length < initialLength) {
      console.log(`❌ Player ${socketId} left queue. Queue size: ${this.queue.length}`);
    }
  }

  async findMatch(): Promise<Match | null> {
    if (this.queue.length < 2) {
      return null;
    }

    // Take the first two players
    const player1 = this.queue.shift()!;
    const player2 = this.queue.shift()!;

    // Create game in database
    const game = await this.prisma.game.create({
      data: {
        player1Id: player1.userId,
        player2Id: player2.userId,
        status: 'PLAYING',
      },
    });

    const match: Match = {
      gameId: game.id,
      player1,
      player2,
    };

    console.log(`🎮 Match found! Game ID: ${game.id}`);
    console.log(`   Player 1: ${player1.socketId}`);
    console.log(`   Player 2: ${player2.socketId}`);

    return match;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  isInQueue(socketId: string): boolean {
    return this.queue.some(p => p.socketId === socketId);
  }
}
