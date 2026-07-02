import type { RedisService } from './redis.service';
import { CacheService } from './cache.service';

interface RedisClientMock {
  get: jest.Mock<Promise<string | null>, [string]>;
  set: jest.Mock<Promise<'OK'>, [string, string, 'EX', number]>;
  del: jest.Mock<Promise<number>, [string]>;
}

describe('CacheService', () => {
  function createClient(value: string | null = null, deleted = 1): RedisClientMock {
    return {
      get: jest.fn<Promise<string | null>, [string]>(() => Promise.resolve(value)),
      set: jest.fn<Promise<'OK'>, [string, string, 'EX', number]>(() => Promise.resolve('OK')),
      del: jest.fn<Promise<number>, [string]>(() => Promise.resolve(deleted)),
    };
  }

  function createService(client: RedisClientMock): CacheService {
    const redis = {
      getClient: () => client,
    } as unknown as RedisService;

    return new CacheService(redis);
  }

  it('returns parsed JSON values from redis', async () => {
    const client = createClient('{"id":"product_1","count":2}');
    const service = createService(client);

    await expect(service.get<{ id: string; count: number }>('catalog:item')).resolves.toEqual({
      id: 'product_1',
      count: 2,
    });
    expect(client.get).toHaveBeenCalledWith('catalog:item');
  });

  it('returns null when redis has no value for a key', async () => {
    const client = createClient(null, 0);
    const service = createService(client);

    await expect(service.get('missing')).resolves.toBeNull();
  });

  it('stores JSON with an explicit ttl', async () => {
    const client = createClient();
    const service = createService(client);

    await service.set('cart:1', { total: 1200 }, 60);

    expect(client.set).toHaveBeenCalledWith('cart:1', '{"total":1200}', 'EX', 60);
  });

  it('deletes a key', async () => {
    const client = createClient();
    const service = createService(client);

    await service.delete('cart:1');

    expect(client.del).toHaveBeenCalledWith('cart:1');
  });
});
