import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@nova/api-client', '@nova/types'],
};

export default nextConfig;
