import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CatalogService } from './catalog.service';
import { ListAdminCatalogDto, ListCatalogProductsDto } from './dto/catalog-query.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  listProducts(@Query() query: ListCatalogProductsDto) {
    return this.catalogService.listProducts(query);
  }

  @Get('products/search')
  searchProducts(@Query() query: ListCatalogProductsDto) {
    return this.catalogService.listProducts(query);
  }

  @Get('products/:slug')
  getProductBySlug(@Param('slug') slug: string) {
    return this.catalogService.getProductBySlug(slug);
  }

  @Get('categories')
  listCategories(@Query() query: ListAdminCatalogDto) {
    return this.catalogService.listCategories(query);
  }

  @Get('brands')
  listBrands(@Query() query: ListAdminCatalogDto) {
    return this.catalogService.listBrands(query);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/catalog')
export class AdminCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  listCategories(@Query() query: ListAdminCatalogDto) {
    return this.catalogService.listCategories(query);
  }

  @Get('brands')
  listBrands(@Query() query: ListAdminCatalogDto) {
    return this.catalogService.listBrands(query);
  }
}
