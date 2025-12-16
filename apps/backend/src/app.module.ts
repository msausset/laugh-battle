import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { GameModule } from './game/game.module';
import { WebrtcModule } from './webrtc/webrtc.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MatchmakingModule,
    GameModule,
    WebrtcModule,
  ],
})
export class AppModule {}
