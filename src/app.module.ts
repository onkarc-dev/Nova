import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from '@config/app.config';
import { databaseConfig } from '@config/database.config';
import { emailConfig } from '@config/email.config';
import { validateEnvironment } from '@config/environment';
import { jwtConfig } from '@config/jwt.config';
import { paymentConfig } from '@config/payment.config';
import { redisConfig } from '@config/redis.config';
import { storageConfig } from '@config/storage.config';
import { DatabaseModule } from '@database/database.module';
import { HealthModule } from '@health/health.module';
import { RateLimitMiddleware } from '@/middlewares/rate-limit.middleware';
import { RequestIdMiddleware } from '@/middlewares/request-id.middleware';
import { RequestLoggingMiddleware } from '@/middlewares/request-logging.middleware';
import { QueueModule } from '@/queues/queue.module';
import { AuthModule } from '@/auth/auth.module';
import { SellersModule } from '@/sellers/sellers.module';
import { UsersModule } from '@/users/users.module';
import { CartModule } from '@/cart/cart.module';
import { CheckoutModule } from '@/checkout/checkout.module';
import { OrdersModule } from '@/orders/orders.module';
import { WishlistModule } from '@/wishlist/wishlist.module';
import { InventoryModule } from '@/inventory/inventory.module';
import { PaymentsModule } from '@/payments/payments.module';
import { SellerProductsModule } from '@/seller-products/seller-products.module';
import { AdminProductsModule } from '@/admin-products/admin-products.module';
import { SearchModule } from '@/search/search.module';
import { AnalyticsModule } from '@/analytics/analytics.module';
import { ReturnsModule } from '@/returns/returns.module';
import { EmailModule } from '@/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, emailConfig, paymentConfig, storageConfig],
    }),
    DatabaseModule,
    QueueModule,
    AuthModule,
    UsersModule,
    SellersModule,
    WishlistModule,
    InventoryModule,
    CartModule,
    CheckoutModule,
    OrdersModule,
    PaymentsModule,
    SellerProductsModule,
    AdminProductsModule,
    SearchModule,
    AnalyticsModule,
    ReturnsModule,
    EmailModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware, RateLimitMiddleware, RequestLoggingMiddleware).forRoutes('*');
  }
}
