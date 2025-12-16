import { Module } from '@nestjs/common';
import { MatchmakingGateway } from './matchmaking.gateway';
import { MatchmakingService } from './matchmaking.service';

@Module({
  providers: [MatchmakingGateway, MatchmakingService],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}
