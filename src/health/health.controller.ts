import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('health')
  healthCheck() {
    return this.health.health();
  }

  @Get('ready')
  readiness() {
    return this.health.ready();
  }

  @Get('version')
  version() {
    return this.health.version();
  }

  @Get('database')
  database() {
    return this.health.database();
  }

  @Get('redis')
  redis() {
    return this.health.redis();
  }
}
