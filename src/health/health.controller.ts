import { Controller, Get, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Version(VERSION_NEUTRAL)
  @Get('health')
  healthCheck() {
    return this.health.health();
  }

  @Version(VERSION_NEUTRAL)
  @Get('ready')
  readiness() {
    return this.health.ready();
  }

  @Version(VERSION_NEUTRAL)
  @Get('version')
  version() {
    return this.health.version();
  }

  @Version(VERSION_NEUTRAL)
  @Get('database')
  database() {
    return this.health.database();
  }

  @Version(VERSION_NEUTRAL)
  @Get('redis')
  redis() {
    return this.health.redis();
  }
}
