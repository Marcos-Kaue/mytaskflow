/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Em produção, queremos erros TypeScript. Remova esta linha para ser estrito.
    // ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Otimizações para Vercel
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
}

export default nextConfig
