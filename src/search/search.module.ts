import { Module } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { DatabaseSearchProvider } from './database-search.provider';
import { getMeilisearchConfig, MeilisearchProvider } from './meilisearch.provider';
import { SearchController } from './search.controller';
import { SEARCH_PROVIDER, type SearchProvider } from './search-provider.interface';
import { SearchService } from './search.service';

@Module({
  controllers: [SearchController],
  providers: [
    DatabaseSearchProvider,
    SearchService,
    {
      provide: SEARCH_PROVIDER,
      inject: [DatabaseSearchProvider, PrismaService],
      useFactory: createSearchProvider,
    },
  ],
  exports: [SearchService],
})
export class SearchModule {}

export function createSearchProvider(databaseProvider: DatabaseSearchProvider, prisma: PrismaService): SearchProvider {
  const config = getMeilisearchConfig();
  return config ? new MeilisearchProvider(prisma, config) : databaseProvider;
}
