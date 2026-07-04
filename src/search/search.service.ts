import { Inject, Injectable, Logger } from '@nestjs/common';
import type { SearchProductsDto } from './dto/search-products.dto';
import { SEARCH_PROVIDER, type SearchProvider } from './search-provider.interface';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(@Inject(SEARCH_PROVIDER) private readonly provider: SearchProvider) {}

  searchProducts(query: SearchProductsDto) {
    return this.provider.searchProducts(query);
  }

  autocompleteProducts(query: string, limit = 10) {
    return this.provider.autocompleteProducts(query, Math.min(limit, 25));
  }

  async reindex() {
    const indexedProducts = await this.provider.reindexProducts();
    return { provider: this.provider.name, indexedProducts };
  }

  scheduleProductIndex(productId: string): void {
    void this.provider.indexProduct(productId).catch((error: unknown) => {
      this.logger.error(`Search indexing failed for product ${productId}.`, error instanceof Error ? error.stack : undefined);
    });
  }

  scheduleProductRemoval(productId: string): void {
    void this.provider.removeProduct(productId).catch((error: unknown) => {
      this.logger.error(`Search index removal failed for product ${productId}.`, error instanceof Error ? error.stack : undefined);
    });
  }
}
