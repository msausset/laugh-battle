import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameState } from '../types';

@Injectable()
export class GameService {
  // In-memory game states (for quick access)
  private activeGames = new Map<string, GameState>();

  constructor(private prisma: PrismaService) {}

  async createGame(player1Id: string, player2Id: string): Promise<GameState> {
    const game = await this.prisma.game.create({
      data: {
        player1Id,
        player2Id,
        status: 'PLAYING',
      },
    });

    const gameState: GameState = {
      gameId: game.id,
      player1Id,
      player2Id,
      player1SocketId: '',
      player2SocketId: '',
      status: 'playing',
      startedAt: new Date(),
    };

    this.activeGames.set(game.id, gameState);

    return gameState;
  }

  getGame(gameId: string): GameState | undefined {
    return this.activeGames.get(gameId);
  }

  async endGame(gameId: string, winnerId: string): Promise<void> {
    const game = this.activeGames.get(gameId);
    if (!game) return;

    // Update in-memory state
    game.status = 'finished';
    game.winnerId = winnerId;

    // Update database
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'FINISHED',
        winnerId,
        endedAt: new Date(),
      },
    });

    console.log(`🏆 Game ${gameId} ended. Winner: ${winnerId}`);

    // Remove from active games after a delay (to allow clients to fetch results)
    setTimeout(() => {
      this.activeGames.delete(gameId);
    }, 30000); // 30 seconds
  }

  async cancelGame(gameId: string): Promise<void> {
    const game = this.activeGames.get(gameId);
    if (!game) return;

    // Update database
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'CANCELLED',
        endedAt: new Date(),
      },
    });

    this.activeGames.delete(gameId);
    console.log(`❌ Game ${gameId} cancelled`);
  }

  setPlayerSocket(gameId: string, playerId: string, socketId: string): void {
    const game = this.activeGames.get(gameId);
    if (!game) return;

    if (game.player1Id === playerId) {
      game.player1SocketId = socketId;
    } else if (game.player2Id === playerId) {
      game.player2SocketId = socketId;
    }
  }
}
