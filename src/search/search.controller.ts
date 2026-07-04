import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { AutocompleteProductsDto, SearchProductsDto } from './dto/search-products.dto';
import { SearchService } from './search.service';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('search/products')
  searchProducts(@Query() query: SearchProductsDto) {
    return this.searchService.searchProducts(query);
  }

  @Get('search/autocomplete')
  autocompleteProducts(@Query() query: AutocompleteProductsDto) {
    return this.searchService.autocompleteProducts(query.q, query.limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/search/reindex')
  reindex() {
    return this.searchService.reindex();
  }
}
